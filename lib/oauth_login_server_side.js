var url = require('url');
var path = require('path');
var fs = require('fs');
var request = require('request');

// config information about the providers
// todo fetch the google three fields from https://accounts.google.com/.well-known/openid-configuration
var providers = JSON.parse(fs.readFileSync(path.join(__dirname, '../conf/providers.json'), 'utf8'));

/**
 * Send an auth key back to the user
 *
 */
function sendKey(status, id, res) {
    var stringified = JSON.stringify({
	id: id
	// TODO	auth_key: key
    });
    
    res.writeHead(status, {
	'Content-Length': stringified.length,
	'Content-Type': 'application/json'
    });

    res.write(stringified);
    res.end();
}
var allGood = sendKey.bind(undefined, 200);
var allBad = sendKey.bind(undefined, 500);

/**
 * Listen for requests for oauth logins from the clients
 *
 */
exports.doOAuthLogin = function doOAuthLogin(req, res) {
    //
    // the client is giving has an oauth code; we want to exchange
    // this for an access_token, and, from there, for some identifying
    // information from the user's profile. first thing's first...
    //
    
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    // here is the oauth code the user gave us
    var code = query.code;
    
    var providerName = query.provider;
    var provider = providers[providerName];

    //
    // this is the body of our access_token request
    //
    var form = {
	client_id: provider.credentials.client_id,
	client_secret: provider.credentials.client_secret,
	code: code
    };
    if (provider.token_endpoint_form) {
	for (var x in provider.token_endpoint_form) {
	    form[x] = provider.token_endpoint_form[x];
	}
    }

    //
    // form the request options for the access_token
    //
    var options = {
	url: provider.token_endpoint,
	method: 'POST',
	headers: {
	    'Content-Type': 'application/json'
	},
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
	if (err) {
	    console.log(JSON.stringify(err));
	    allBad(undefined, res);
	} else {
	    //
	    // all right, we now have an access_token
	    //
	    if (typeof body == "string") {
		body = JSON.parse(body);
	    }
	    
	    //
	    // now we request the user's profile, so that we have some
	    // persistent identifying information; e.g. email address
	    // for account handle
	    //
	    request({
		url: provider.userinfo_endpoint,
		method: 'GET',
		headers: {
		    'Accept': 'application/json',
		    'Authorization': (provider.authorization_type || 'token') + ' ' + body.access_token,
		    "User-Agent": "OpenWhisk"
		}
	    }, function(err2, response2, body2) {
		if (err2) {
		    console.log("ERR2 " + JSON.stringify(err2));
		    allBad(undefined, res);
		} else {
		    //
		    // great, now we have the profile!
		    //
		    if (typeof body2 == "string") {
			body2 = JSON.parse(body2);
		    }

		    allGood(providerName + "::" + body2[provider.userinfo_identifier], res);
		}
	    });
	}
    });
}

