# OpenWhisk oauth Package

## Setup

The `init.sh` script will populate your OpenWhisk assets. In addition,
the first time you use the script, it will also prompt you to set up
oauth credentials with the providers of your choosing.

### Configuring Providers By Hand

If you prefer to set up the provider credentials by hand, then
   1. `cp conf/providers-template.json conf/providers.json`
   2. edit `conf/providers.json` to add your client_ids and client_secrets
   3. `cp conf/providers-client-template.json conf/providers.client.json`
   4. edit `conf/providers-client` to add your client_ids

### Supported Providers

This package current supports these providers:

   - github: https://github.com/settings/developers
   - google: https://console.developers.google.com/apis/credentials

## Demo usage

First, create the backend assets, by executing the script
`init.sh`. Then, you can test that this all works by executing the
`./bin/login` script.

```
% ./init.sh
% ./bin/login github
{
    "providerName": "github",
    "id": "starpit"
}
ok
```