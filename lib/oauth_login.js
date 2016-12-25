const fs = require('fs'),
      open = require('open'),
      path = require('path'),
      propertiesParser = require('properties-parser'),
      config = propertiesParser.read(path.join('conf', 'config.sh')),
      providers = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'conf', 'providers-client.json'), 'utf8'));

exports.doLoginWithProvider = function doLoginWithProvider(providerName) {
    var provider = providers[providerName];
    if (!provider) {
	console.log("Unsupported auth provider " + providerName);
	process.exit();
    }

    var url = provider.authorization_endpoint
	+ "?client_id=" + provider.credentials.client_id
	+ "&redirect_uri=" + encodeURIComponent(config.APIGW)
	+ "&state=" + providerName
	+ (provider.authorization_endpoint_query || "");
	
    open(url);
} /* end of doLoginWithProvider */
