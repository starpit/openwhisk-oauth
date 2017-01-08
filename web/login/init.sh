#!/usr/bin/env bash

#wsk api-experimental delete /objectstore /getAuthToken
#GET_TOKEN_ENDPOINT=`wsk api-experimental create /objectstore /getAuthToken get objectstore/getAuthToken | grep https`

#wsk api-experimental delete /objectstore /createObjectAsReq
#UPLOAD_ENDPOINT=`wsk api-experimental create /objectstore /createObjectAsReq post objectstore-${CONTAINER}/createObjectAsReq | grep https`

. ../../conf/config.sh
. ~/.wskprops

# take the page name from the name of the current directory
PAGE=${PWD##*/}

# holy cow, we need to replace "&" with "\\&", so that awk doesn't treat & as "replace with matching text"
PROVIDERS="`cat ../../conf/providers-client.json | tr -d '\n' | sed 's/&/\\\\\\\&/g'`"
echo -n "."

LOGIN_ENDPOINT=`wsk api-experimental list "/${PACKAGE}" | grep "${ACTION}" | awk '{print $NF}'`
echo -n "."

wsk api-experimental create "/${PACKAGE}" /checkForCompletion post "${PACKAGE}/checkForCompletion" 2>&1 | grep -v "already exists"
echo -n "."

CHECK_FOR_COMPLETION_ENDPOINT=`wsk api-experimental list "/${PACKAGE}" | grep checkForCompletion | awk '{print $NF}'`
echo -n "."


# cheapskate templating
sed -e "s#{CHECK_FOR_COMPLETION_ENDPOINT}#${CHECK_FOR_COMPLETION_ENDPOINT}#g" \
    -e "s#{PROVIDERS}#${PROVIDERS}#g" \
    -e "s#{LOGIN_ENDPOINT}#${LOGIN_ENDPOINT}#g" \
    ${PAGE}-template.js > ${PAGE}.js
echo -n "."

sed -e '/{CSS}/ {' -e 'r ../common/common.css' -e 'd' -e '}' \
    -e '/{JS/ {' -e "r ./${PAGE}.js" -e 'd' -e '}' \
    ${PAGE}-template.html > ${PAGE}.html
echo "."

# deploy the assets to objectstore
../common/deploy.sh ${PAGE}.html

echo "ok"
