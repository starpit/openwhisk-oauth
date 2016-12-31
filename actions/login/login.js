var request = require('request');

/**
 * Listen for requests for oauth logins from the clients
 *
 * the client is giving has an oauth code; we want to exchange
 * this for an access_token, and, from there, for some identifying
 * information from the user's profile. first thing's first...
 *
 */
function main(params) {
    return new Promise((resolve, reject) => {
	// here are the provider secrets
	const providers = params.providers;
    
	// here is the oauth code the client gave us
	const code = params.code;

	let state;
	try {
	    state = JSON.parse(params.state)
	} catch (e) {
	    console.log('Error parsing state', state)
	}
	
	var providerName = params.provider || params.providerName || state.providerName;
	console.log(`providerName=${providerName}`);
	var provider = providers[providerName];

	//
	// this is the body of our access_token request
	//
	var form = {
	    client_id: provider.credentials.client_id,
	    client_secret: provider.credentials.client_secret,
	    code: code
	};
	const params_token_endpoint_form = params.token_endpoint_form || {};
	if (provider.token_endpoint_form) {
	    for (var x in provider.token_endpoint_form) {
		form[x] = params_token_endpoint_form[x] || provider.token_endpoint_form[x];
	    }
	}

	//
	// form the request options for the access_token
	//
	var options = {
	    url: provider.endpoints.token,
	    method: 'POST',
	    headers: {
		'Content-Type': 'application/json'
	    }
	};
	if (provider.token_endpoint_form_is_json) {
	    options.headers['Accept'] = 'application/json';
	    options.body = form;
	    options.json = true;
	} else {
	    options.form = form;
	}

	//
	// ok, here we go, exchanging the oauth code for an access_token
	//
	request(options, function(err, response, body) {
	    if (err || response.statusCode >= 400) {
		const errorMessage = err || { statusCode: response.statusCode, body: body }
		console.error(JSON.stringify(errorMessage));
		reject(errorMessage);

	    } else {
		//
		// all right, we now have an access_token
		//
		if (typeof body == 'string') {
		    body = JSON.parse(body);
		}

		// console.log("TOKEN RESPONSE", body)

		//
		// now we request the user's profile, so that we have some
		// persistent identifying information; e.g. email address
		// for account handle
		//
		request({
		    url: provider.endpoints.userinfo,
		    method: 'GET',
		    headers: {
			'Accept': 'application/json',
			'Authorization': (provider.authorization_type || 'token') + ' ' + body.access_token,
			'User-Agent': 'OpenWhisk'
		    }
		}, function(err2, response2, body2) {
		    if (err2 || response2.statusCode >= 400) {
			const errorMessage = err2 || { statusCode: response2.statusCode, body: body2 }
			console.error(JSON.stringify(errorMessage));
			reject(errorMessage);

		    } else {
			//
			// great, now we have the profile!
			//
			if (typeof body2 == 'string') {
			    body2 = JSON.parse(body2);
			}

			// console.log("PROFILE RESPONSE", body2)

			resolve({
			    tid: state && state.tid, // transaction id, so the client knows when we're done
			    
			    provider: providerName,
			    access_token: body.access_token,
			    id: body2[provider.userinfo_identifier]
			});
		    }
		});
	    }
	});
    });
}

