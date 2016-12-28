var request = require('request')

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

	request({
	    url: provider.endpoints.userinfo,
	    method: 'GET',
	    headers: {
		'Accept': 'application/json',
		'Authorization': (provider.authorization_type || 'token') + ' ' + params.access_token,
		'User-Agent': 'OpenWhisk'
	    }
	}, function(err, response, body) {
	    if (err || response.statusCode != 200) {
		const rejectionMessage = err || { statusCode: response.statusCode, body: JSON.parse(body) }
		console.error(rejectionMessage)
		reject(rejectionMessage)

	    } else {
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
