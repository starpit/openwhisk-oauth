# Setup

You will need to create oauth applications for the providers in `conf/providers-template*.json`

- github: https://github.com/settings/developers

- google: https://console.developers.google.com/apis/credentials

Make sure to use http://localhost:15231 as the redirect_uri when setting up the oauth applications.


# Demo usage

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