var http = require('http');
var open = require('open');
var url = require('url');
var path = require('path');
var fs = require('fs');
var request = require('request');

var expandHomeDir = require('expand-home-dir'),
    propertiesParser = require('properties-parser'),
    wskprops = process.env.WSK_AUTH || propertiesParser.read(process.env.WSK_CONFIG_FILE || expandHomeDir('~/.wskprops')),
    owProps = {
        apihost: process.env.WSK_APIHOST || wskprops.APIHOST || 'openwhisk.ng.bluemix.net',
        api_key: process.env.WSK_AUTH || wskprops.AUTH,
        namespace: process.env.WSK_NAMESPACE || wskprops.NAMESPACE || '_',
        ignore_certs: process.env.NODE_TLS_REJECT_UNAUTHORIZED == "0"
    },
    ow = require('openwhisk')(owProps),
    config = propertiesParser.read(path.join('conf', 'config.sh'));


// change this to whatever we decide to use for the controller route
var backendURI = 'http://localhost:8080/oauth/v1/authenticate';

// DO NOT CHANGE THIS, without also changing the oauth application registrations
var port = 15231;

// config information about the providers
var providers = JSON.parse(fs.readFileSync(path.join(__dirname, '../conf/providers-client.json'), 'utf8'));

/**
 * Redirect the user to a given local path
 *
 * This lets us avoid displaying the residual leftovers over oauth in
 * the URL bar
 *
 */
function redirect(path, res) {
    res.writeHead(301, {
	Location: "http://localhost:" + port + "/" + path
    });
    res.end();
}

/**
 * Poor man's static file serving
 *
 */
function sendFile(file, res) {
    try {
	var filePath = path.join(__dirname, "../public/" + file);
	var stat = fs.statSync(filePath);

	res.writeHead(200, {
	    'Content-Length': stat.size,
	    'Content-Type': 'text/html',
	});

	var stream = fs.createReadStream(filePath);
	stream.pipe(res);
    } catch (e) {
	res.writeHead(404);
	res.end();
    }
}

var allGood = redirect.bind(undefined, 'logged_in.html'); // what file to serve when the user has logged in
var allBad = redirect.bind(undefined, '404.html'); // what file to serve when we oops'd

exports.doLoginWithProvider = function doLoginWithProvider(providerName) {
    var provider = providers[providerName];
    if (!provider) {
	console.log("Unsupported auth provider " + providerName);
	process.exit();
    }

    //
    // oauth requires that we use a browser to accept the user's
    // credentials, and that we service a redirect_uri that the identity
    // provider will call with the oauth code (this code is a partial
    // assurance that the user is who they claim to be; the rest of the
    // oauth handshake must be handled on the backend, in order to avoid
    // exposing any of our oauth application secrets to the client)
    //
    var server = http.createServer(function onCodeCallback(req, res) {
	//
	// cool, we should now have an oauth code
	//
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;

	if (!query.code) {
	    //
	    // then we're just serving up a static file
	    //
	    return sendFile(url_parts.path, res);
	}

	//
	// pass this code to the backend, and get back an auth_key
	//
	ow.actions.invoke({
	    actionName: `${config.PACKAGE}/login`,
	    blocking: true,
	    params: {
		code: query.code,
		provider: providerName
	    }
	}).then(activation => {
	    //
	    // we should now have an auth_key
	    //
	    console.log("All good", activation.response.result);
	    allGood(res);
	}).catch(err => {
	    console.log(JSON.stringify(err));
	    allBad(res);
	});
    });

    server.listen(port, function() {
	//
	// when the server is up, we are ready to open up a browser so
	// that the user can start the login process
	//
	// what happens here: we open the browser to the provider's
	// authorization endpoint, specifying a redirect_uri that points
	// back to the server we just started up; the provider will call
	// us back with the oauth code
	//
	var url = provider.authorization_endpoint
	    + "?client_id=" + provider.credentials.client_id
	    + "&redirect_uri=" + encodeURIComponent("http://localhost:" + port)
	    + (provider.authorization_endpoint_query || "");
	
	open(url);
    });
} /* end of doLoginWithProvider */
