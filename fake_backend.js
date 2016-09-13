var http = require('http');

//
// a fake backend for demo purposes
//
var server = http.createServer(require('./lib/oauth_login_server_side').doOAuthLogin);
var port = 5001;
server.listen(port, function() {
    console.log("Hi, I'm the fake OpenWhisk backend");
});
