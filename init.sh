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

./init-actions.sh

CFC_WITH_AUTHZ="checkForCompletion-with-authz"
wsk action update --sequence "${PACKAGE}/${CFC_WITH_AUTHZ}" "${PACKAGE}/checkForCompletion","${PACKAGE}/validate"
wsk api-experimental delete "/${PACKAGE}" /checkForCompletion 2>&1 | grep -v "does not exist"
wsk api-experimental create "/${PACKAGE}" /checkForCompletion post "${PACKAGE}/${CFC_WITH_AUTHZ}" 2>&1 | grep -v "already exists"
