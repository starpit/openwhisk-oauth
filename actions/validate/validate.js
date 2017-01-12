var request = require('request')
var util = require('util')

/**
 * Perform a simple authorization check
 *
 */
function isAuthorized(providerName, user, acl) {
    console.log("isAuthorized?", providerName, user, acl)
    
    return acl &&
	(acl === "*"
	 || util.isArray(acl) && acl.find(A => A.user === user && A.provider === providerName)
	 || acl[`${providerName}:${user}`])
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

	console.log(`Using provider ${providerName}`, provider)
	
	if (!provider) {
	    return reject({ status: "403", message: "Permission denied" })
	}
	
	request({
	    url: provider.endpoints.userinfo,
	    method: 'GET',
	    headers: {
		'Accept': 'application/json',
		'Authorization': (provider.authorization_type || 'token') + ' ' + params.access_token,
		'User-Agent': 'OpenWhisk'
	    }
	}, function(err, response, body) {
	    console.log("Response from provider", err, response.statusCode, body)

	    if (typeof body === "string") {
		body = JSON.parse(body)
	    }

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
		delete params.providers
		delete params.token_endpoint_form
		delete params.acl

		// TODO move these to an expunge action
		// delete params.provider
		//delete params.providerName
		//delete params.access_token

		params.authenticated = true
		resolve(params)
	    }
	})
    })
}
