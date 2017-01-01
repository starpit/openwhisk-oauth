var request = require('request')

/**
 * Perform a simple authorization check
 *
 */
function onACL(providerName, user, acl) {
    return !acl || acl.find(A => A.user === user && A.provider === providerName)
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

	console.log('Using provider ' + JSON.stringify(provider))
	
	request({
	    url: provider.endpoints.userinfo,
	    method: 'GET',
	    headers: {
		'Accept': 'application/json',
		'Authorization': (provider.authorization_type || 'token') + ' ' + params.access_token,
		'User-Agent': 'OpenWhisk'
	    }
	}, function(err, response, body) {
	    console.log("GOT", err, response.statusCode)
	    
	    if (err || response.statusCode != 200) {
		const rejectionMessage = err || { statusCode: response.statusCode, body: JSON.parse(body) }
		console.error(rejectionMessage)
		reject(rejectionMessage)

	    } else if (onACL(providerName, body[provider.userinfo_identifier], params.acl)) {
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
