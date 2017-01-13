#!/usr/bin/env bash

OS_HOME=${OS_HOME-~/git/whisk/openwhisk-objectstore}

CONTAINER=public

OS_AUTH=${OS_AUTH-`${OS_HOME}/util/getAuthToken.sh`}

if [ "$2" == "--deploy-only" ]; then
    DEPLOY_ONLY=1
fi

if [ -z "$DEPLOY_ONLY" ]; then
    echo "Deploying `basename $1`"

    wsk action invoke objectstore/listContainers -b -r -p authToken "${OS_AUTH}" | grep ${CONTAINER} > /dev/null
    if [ $? == 1 ]; then
	(wsk action invoke objectstore/createContainer -b -r \
	     -p authToken "${OS_AUTH}" \
	     -p container ${CONTAINER}) > /dev/null

	if [ $? == 1 ]; then exit; else echo "Created container ${CONTAINER}"; fi
    fi

    (wsk action invoke objectstore/setContainerPublic -b -r \
	 -p authToken "${OS_AUTH}" \
	 -p container public) > /dev/null
    if [ $? == 1 ]; then exit; else echo "Made container ${CONTAINER} readable by everyone"; fi

    (wsk action invoke objectstore/setContainerMetadata -b -r \
	 -p authToken "${OS_AUTH}" \
	 -p container ${CONTAINER} \
	 -p metadata  "{\"Access-Control-Allow-Origin\": \"*\", \"Access-Control-Expose-Headers\": \"content-type\"}") > /dev/null
    if [ $? == 1 ]; then exit; else echo "Added CORS to container ${CONTAINER}"; fi
fi

REQ=`wsk action invoke objectstore/createObjectAsReq -b -r \
    -p authToken "${OS_AUTH}" \
    -p objectName $1 \
    -p container public`
if [ $? == 1 ]; then exit; fi
node -e "const req = JSON.parse(process.argv[1]); delete req.body; require('fs').createReadStream(\"$1\").pipe(require('request')(req, (err, response) => { if (err) console.error(err); else console.log(req.url) }))" "$REQ"

