const url = require('url'),
      open = require('open'),
      path = require('path'),
      uuid = require('uuid/v4'),
      propertiesParser = require('properties-parser'),
      providers = require(path.join(__dirname, '..', 'conf', 'providers-client.json'))

const expandHomeDir = require('expand-home-dir'),
      wskprops = process.env.WSK_AUTH || propertiesParser.read(process.env.WSK_CONFIG_FILE || expandHomeDir('~/.wskprops')),
      owProps = {
	  apihost: process.env.WSK_APIHOST || wskprops.APIHOST || 'openwhisk.ng.bluemix.net',
	  api_key: process.env.WSK_AUTH || wskprops.AUTH,
	  namespace: process.env.WSK_NAMESPACE || wskprops.NAMESPACE || '_',
	  ignore_certs: process.env.NODE_TLS_REJECT_UNAUTHORIZED == "0"
      },
      ow = require('openwhisk')(owProps)

/**
 * Format a URL that initiates an oauth exchange
 *
 * @return a url, in string form
 */
const endpoint = (providerName, loginEndpoint) => {
    const provider = providers[providerName];
    if (!provider) {
	return console.error("Unsupported auth provider", providerName);
    }

    //
    // this state object will be passed, by the identity provider,
    // back to the server-side action
    //
    // we tag a random transaction id, so that we can fetch the
    // server-side response
    //
    const state = {
	providerName: providerName,
	tid: uuid()
    }
    
    //
    // format the url that we use to communicate with the identity
    // provider
    //
    const U = url.parse(provider.authorization_endpoint)
    U.query = Object.assign({}, U.query || {}, {
	client_id: provider.credentials.client_id,
	redirect_uri: loginEndpoint,
	state: JSON.stringify(state)
    }, provider.authorization_endpoint_query)

    return {
	endpoint: url.format(U),
	tid: state.tid
    }
}
exports.endpoint = endpoint

const pollForCompletion = (tid, since) => exitCode => {
    if (exitCode == 0) {
	const waitForThisAction = 'login'

	const pollOnce = iter => {
	    if (iter > 5) {
		//
		// if we've been waiting for a while, let the user
		// know we're still alive
		//
		process.stdout.write('.')
	    }
	    ow.activations.list({ limit: 5, name: waitForThisAction, since: since, docs: true }).then(list => {
		for (var i = 0; i < list.length; i++) {
		    var activationDetails = list[i];

		    try {
			if (activationDetails.response.result.tid === tid
			    /*&& activationDetails.namespace.indexOf('oauth') >= 0*/) {
			    if (iter > 5) {
				// clear to a new line after the '.' we've been printing
				console.log()
			    }
			    delete activationDetails.response.result.tid
			    console.log(JSON.stringify(activationDetails.response.result, undefined, 4))
			    console.log('ok')
			    process.exit(0)
			}
		    } catch (e) {
		    }
		}

		setTimeout(() => pollOnce(iter + 1), 500)
	    })
	}
	pollOnce(0)
    }
}

const openAndPollForCompletion = pair =>
   ow.activations.list({ limit: 1, docs: true })
      .then(lastOne => open(pair.endpoint).on('exit',
					      pollForCompletion(pair.tid, lastOne[0].end)))

/**
 * Initiate an oauth exchange by opening a new browser window
 *
 */
exports.loginViaBrowser = (providerName, loginEndpoint) => openAndPollForCompletion(endpoint(providerName, loginEndpoint))
