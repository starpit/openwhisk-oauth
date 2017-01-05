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

## Web Front Ends

The web directory contains a sample login page.

## Validation Flows

If you wish to create oauth flows that validate credentials, you can
make use of the `validate` action in the actions directory. For
example, if you have an action `A` that you wish to protect with a
validate authentication, you may create a sequence:

```
wsk action create --sequence A_with_auth oauth/validate,A
```

The utility `bin/with-authn` does this, such that `bin/with-authn A`
will create a sequence named `A-with-authentication`. 

The `validate` action takes as input this structure, which is included
the return value of the login action:

```
{
	provider: "github",
	access_token: "xxx"
}
```

You can now expose `A_with_auth` via the API gateway, so that no
secrets are exposed:

```
wsk api-experimental create /myapp /A get A_with_auth
```


## TODOs

We will need to add support for ACLs. The plan here is to update the
`validate` action so that it has a binding parameter, which is perhaps
an array of identities, e.g. `[{ provider: "github", user: "starpit"
}]`.
