const request = require('request')

/**
 * Listen for requests for oauth logins from the clients
 *
 * the client is giving has an oauth code; we want to exchange
 * this for an access_token, and, from there, for some identifying
 * information from the user's profile. first thing's first...
 *
 */
const main = params => doLogin(params)
      .catch(retry(doLogin, params))
      .catch(retry(doLogin, params))
      .catch(retry(doLogin, params))
      .catch(retry(doLogin, params))
      .catch(giveup)

/**
 * Oh well, no success after multiple retries
 *
 */
const giveup = err => {
    console.error('Giving up after multiple errors', err)
    return Promise.reject({
	statusCode: err.statusCode,
	body: err
    })
}

/**
 * Some error occurred. Log it, and retry.
 *
 */
const retry = (f, params) => err => {
    console.error('Retrying after error', err)
    return f(params)
}

const doLogin = params => new Promise((resolve, reject) => {
    // here are the provider secrets
    const providers = params.providers
    
    // here is the oauth code the client gave us
    const code = params.code

    let state
    try {
	state = JSON.parse(params.state)
    } catch (e) {
	console.log('Error parsing state', state)
    }
	
    const providerName = params.provider || params.providerName || state.providerName
    // console.log(`providerName=${providerName}`)
    const provider = providers[providerName]

    //
    // this is the body of our access_token request
    //
    const form = {
	client_id: provider.credentials.client_id,
	client_secret: provider.credentials.client_secret,
	code: code
    }
    const params_token_endpoint_form = params.token_endpoint_form || {}
    if (provider.token_endpoint_form) {
	for (let x in provider.token_endpoint_form) {
	    form[x] = params_token_endpoint_form[x] || provider.token_endpoint_form[x]
	}
    }

    //
    // form the request options for the access_token
    //
    const options = {
	url: provider.endpoints.token,
	method: 'POST',
	headers: {
	    'Content-Type': 'application/json'
	}
    }
    if (provider.token_endpoint_form_is_json) {
	options.headers['Accept'] = 'application/json'
	options.body = form
	options.json = true
    } else {
	options.form = form
    }
    
    if (provider.token_endpoint_needs_auth) {
	options.auth = {
	    user: form.client_id,
	    pass: form.client_secret
	}
    }
    //console.log(options)

    //
    // ok, here we go, exchanging the oauth code for an access_token
    //
    request(options, function(err, response, body) {
	if (err || response.statusCode >= 400) {
	    const errorMessage = err || { statusCode: response.statusCode, body: body }
	    console.error(JSON.stringify(errorMessage))
	    reject(errorMessage)

	} else {
	    // console.log(`TOKEN RESPONSE ${body}`)

	    //
	    // all right, we now have an access_token
	    //
	    if (typeof body === 'string') {
		try {
		    body = JSON.parse(body)
		} catch (err) {
		    console.error(err)
		    return reject(err)
		}
	    }

	    //
	    // now we request the user's profile, so that we have some
	    // persistent identifying information; e.g. email address
	    // for account handle
	    //
	    request({
		url: provider.endpoints.userinfo + (provider.token_as_query ? `?${provider.token_as_query}=${body.access_token}` : ''),
		method: 'GET',
		headers: {
		    'Accept': 'application/json',
		    'Authorization': (provider.authorization_type || 'token') + ' ' + body.access_token,
		    'User-Agent': 'OpenWhisk'
		}
	    }, function(err2, response2, body2) {
		if (err2 || response2.statusCode >= 400) {
		    const errorMessage = err2 || { statusCode: response2.statusCode, body: body2 }
		    console.error(JSON.stringify(errorMessage))
		    reject(errorMessage)

		} else {
		    //
		    // great, now we have the profile!
		    //
		    if (typeof body2 === 'string') {
			try {
			    body2 = JSON.parse(body2)
			} catch (err) {
			    console.error(err)
			    return reject(err)
			}
		    }

		    // console.log("Profile Response", body2)

		    resolve({
			provider: providerName,
			access_token: body.access_token,
			id: body2[provider.userinfo_identifier],
			idRecord: provider.userinfo_identifier_full_record && body2,

			access_token_body: body,
			state: state
		    })
		}
	    })
	}
    })
})
