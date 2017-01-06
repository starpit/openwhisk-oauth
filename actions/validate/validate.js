var request = require('request')
var util = require('util')

/**
 * Perform a simple authorization check
 *
 */
function isAuthorized(providerName, user, acl) {
    return !acl
	|| util.isArray(acl) && acl.find(A => A.user === user && A.provider === providerName)
	|| acl[`${providerName}:${user}`]
}

/**
 * Validate a given access_token
 *
 */
function main(params) {
    return new Promise((resolve, reject) => {
	// here are the provider secrets
	const providers = params.providers
	const providerName = params.provider || params.providerName
	const provider = providers[providerName]

	if (!provider) {
	    return reject(`Provider not found for providerName ${providerName}`)
	}
	
	console.log(`Using provider ${providerName}`)
	
	request({
	    url: provider.endpoints.userinfo,
	    method: 'GET',
	    headers: {
		'Accept': 'application/json',
		'Authorization': (provider.authorization_type || 'token') + ' ' + params.access_token,
		'User-Agent': 'OpenWhisk'
	    }
	}, function(err, response, body) {
	    console.log("Response from provider", err, response.statusCode)

	    if (err || response.statusCode != 200) {
		//
		// user is not validated
		//
		const rejectionMessage = err || { statusCode: response.statusCode, body: JSON.parse(body) }
		console.error("Validation error", rejectionMessage)
		reject(rejectionMessage)

	    } else if (!isAuthorized(providerName, body[provider.userinfo_identifier], params.acl)) {
		//
		// user is validated but not authorized
		//
		console.error("Not authorized")
		reject({ statusCode: 401, body: "User not authorized to invoke this action" })

	    } else {
		//
		// user is validated and authorized!
		//
		delete params.provider
		delete params.providerName
		delete params.access_token
		delete params.providers

		params.authenticated = true
		resolve(params)
	    }
	})
    })
}
