#!/usr/bin/env bash

. ./conf/config.sh

npm install >& /dev/null

#
# set up the package and the login action
#
wsk package create "${PACKAGE}" 2>&1 | grep -v "resource already exists"
wsk action update --kind nodejs:6 "${PACKAGE}/${ACTION}" "actions/${ACTION}/${ACTION}.js"

wsk api-experimental delete "/${PACKAGE}" "/${ACTION}" 2>&1 | grep -v "does not exist"
wsk api-experimental create "/${PACKAGE}" "/${ACTION}" get "${PACKAGE}/${ACTION}" 2>&1
LOGIN_ENDPOINT=`wsk api-experimental list "/${PACKAGE}" | grep "${ACTION}" | awk '{print $NF}'`

# have we already done the initial setup?
if [ ! -f ./conf/providers.json ]; then
    echo "Performing one-time initialization"
    ./bin/setup-providers $LOGIN_ENDPOINT
fi

#
# Update the package with the providers configuration
#    also, since wsk package update overwrites any not-specified key-value pairs, we have
#          to make sure to keep any ACLs in place!
#
PROVIDERS=`cat conf/providers.json`
ACL=`wsk package get "${PACKAGE}" | grep -v "got package ${PACKAGE}" | jq -c '.parameters[] | select(.key | contains("acl")) .value'`
if [ $? == 1 ]; then
    ACL="{}"
fi
wsk package update "${PACKAGE}" \
    -p providers "${PROVIDERS}" \
    -p token_endpoint_form "{ \"redirect_uri\": \"${LOGIN_ENDPOINT}\" }" \
    -p acl "${ACL}"


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
