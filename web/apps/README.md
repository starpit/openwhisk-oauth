# openwhisk-oauth: Sample Web Apps

This folder contains sample browser-based applications that make use
of the openwhisk-oauth package. These samples illustrate how to make a
fully serverless web app that includes oauth-based authentication.

As part of the demonstration of serverless-ness, each of the web app
subdirectories contains an `init.sh` script that deploys the static
content
to
[Bluemix ObjectStore](https://console.ng.bluemix.net/catalog/object-storage/),
and leverage
the
[openwhisk-objectstore](https://github.com/starpit/openwhisk-objectstore) package.

The deployment scripts assume that you have already set up the
openwhisk-objectstore package. Please define the environment variable
`OS_HOME` to point to your local installation --- currently, the
deploy scripts make use of the `util/getAuthToken.sh` helper script
from that package. Hopefully this will be cleaned up as we go!
