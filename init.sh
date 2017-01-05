#!/usr/bin/env bash

. ./conf/config.sh

npm install >& /dev/null

#
# set up the package and the login action
#
wsk package create "${PACKAGE}" 2>&1 | grep -v "resource already exists"
wsk action delete "${PACKAGE}/${ACTION}" 2>&1 | grep -v "resource does not exist";
wsk action create --kind nodejs:6 "${PACKAGE}/${ACTION}" actions/${ACTION}/${ACTION}.js

# have we already done the initial setup?
wsk api-experimental list "/${PACKAGE}" | grep "${ACTION}"
if [ $? == 1 ]; then
    echo "Performing one-time initialization"
    ./init-apigw.sh

    LOGIN_ENDPOINT=`wsk api-experimental list "/${PACKAGE}" | grep "${ACTION}" | awk '{print $NF}'`
    ./bin/setup-providers $LOGIN_ENDPOINT
else
    LOGIN_ENDPOINT=`wsk api-experimental list "/${PACKAGE}" | grep "${ACTION}" | awk '{print $NF}'`
fi

#
# Update the package with the providers configuration
#
PROVIDERS=`cat conf/providers.json`
wsk package update "${PACKAGE}" \
    -p providers "${PROVIDERS}" \
    -p token_endpoint_form "{ \"redirect_uri\": \"${LOGIN_ENDPOINT}\" }"


#
# create the rest of the actions
#
#   note: we already dealt with login specially, because of the chicken
#         and egg problem of setting up the redirect_uri
#
for dir in actions/*/; do
    action=$(basename "$dir")
    if [ "${action}" != "login" ]; then
       wsk action delete "${PACKAGE}/${action}" 2>&1 | grep -v "resource does not exist"
       wsk action create --kind nodejs:6 "${PACKAGE}/${action}" "${dir}/${action}.js"
    fi
done
