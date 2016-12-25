const fs = require('fs'),
      url = require('url'),
      open = require('open'),
      path = require('path'),
      propertiesParser = require('properties-parser'),
      config = propertiesParser.read(path.join('conf', 'config.sh')),
      providers = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'conf', 'providers-client.json'), 'utf8'));

/**
 * Format a URL that initiates an oauth exchange
 *
 * @return a url, in string form
 */
const endpoint = providerName => {
    const provider = providers[providerName];
    if (!provider) {
	console.error("Unsupported auth provider", providerName);
	return;
    }

    //
    // 
    //
    const U = url.parse(provider.authorization_endpoint)
    U.query = Object.assign({}, U.query || {}, {
	client_id: provider.credentials.client_id,
	redirect_uri: config.APIGW,
	state: providerName
    }, provider.authorization_endpoint_query)

    return url.format(U)
}
exports.endpoint = endpoint

/**
 * Initiate an oauth exchange by opening a new browser window
 *
 */
exports.loginViaBrowser = providerName => open(endpoint(providerName))
