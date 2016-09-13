# Setup

You will need to create oauth applications for the providers in `conf/providers-template*.json`

- github: https://github.com/settings/developers

- google: https://console.developers.google.com/apis/credentials

Make sure to use http://localhost:15231 as the redirect_uri when setting up the oauth applications.


# Demo usage

```
% node fake_backend &
Hi, I'm the fake OpenWhisk backend

% node fake_wsk google
```