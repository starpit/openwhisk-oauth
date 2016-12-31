#!/usr/bin/env bash

OS_HOME=~/git/whisk/openwhisk-objectstore

CONTAINER=public

OS_AUTH=${OS_AUTH-`${OS_HOME}/util/getAuthToken.sh`}

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

(wsk action invoke objectstore/createObject -b -r \
    -p authToken "${OS_AUTH}" \
    -p objectName $1 \
    -p data "`base64 $1`" \
    -p container public)
if [ $? == 1 ]; then exit; else echo "Uploaded content to container ${CONTAINER}"; fi

(wsk action invoke objectstore/setContainerMetadata -b -r \
     -p authToken "${OS_AUTH}" \
     -p container ${CONTAINER} \
     -p metadata  "{\"Access-Control-Allow-Origin\": \"*\", \"Access-Control-Expose-Headers\": \"content-type\"}") > /dev/null
if [ $? == 1 ]; then exit; else echo "Added CORS to container ${CONTAINER}"; fi
