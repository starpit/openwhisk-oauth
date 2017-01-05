#!/usr/bin/env bash

#wsk api-experimental delete /objectstore /getAuthToken
#GET_TOKEN_ENDPOINT=`wsk api-experimental create /objectstore /getAuthToken get objectstore/getAuthToken | grep https`

#wsk api-experimental delete /objectstore /createObjectAsReq
#UPLOAD_ENDPOINT=`wsk api-experimental create /objectstore /createObjectAsReq post objectstore-${CONTAINER}/createObjectAsReq | grep https`

. ../../conf/config.sh
. ~/.wskprops

# holy cow, we need to replace "&" with "\\&", so that awk doesn't treat & as "replace with matching text"
PROVIDERS="`cat ../../conf/providers-client.json | tr -d '\n' | sed 's/&/\\\\\\\&/g'`"
LOGIN_ENDPOINT=`wsk api-experimental list "/${PACKAGE}" | grep ${ACTION}" | awk '{print $NF}'`
OW_ENDPOINT="https://${APIHOST}/api/v1"

awk -v OW_ENDPOINT="${OW_ENDPOINT}" -v OW_AUTH="${AUTH}" -v PROVIDERS="${PROVIDERS}" -v LOGIN_ENDPOINT="${LOGIN_ENDPOINT}" '{gsub("{PROVIDERS}", PROVIDERS); gsub("{OW_ENDPOINT}", OW_ENDPOINT); gsub("{OW_AUTH}", OW_AUTH); gsub("{LOGIN_ENDPOINT}", LOGIN_ENDPOINT); print $0}' login-template.html > login.html
../common.sh login.html

