const url = require('url'),
      path = require('path'),
      client = require(path.join(__dirname, '..', '..', 'lib', 'client')),
      providers = require(path.join(__dirname, '..', '..', 'conf', 'providers-client.json'))

for (var providerName in providers) {
    console.log(`<iframe id="${providerName}" data-provider="${providerName}" data-src="${client.endpoint(providerName).endpoint}"></iframe>`)
}
