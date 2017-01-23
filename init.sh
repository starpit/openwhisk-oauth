#!/usr/bin/env bash

export WSK="${WSK-wsk}"

. ./conf/config.sh

npm install >& /dev/null

./init-login.sh
$WSK api-experimental delete "/${PACKAGE}" "/${ACTION}" 2>&1 | grep -v "does not exist"
$WSK api-experimental create "/${PACKAGE}" "/${ACTION}" get "${PACKAGE}/${ACTION}" 2>&1
LOGIN_ENDPOINT=`$WSK api-experimental list "/${PACKAGE}" | grep "${ACTION}" | awk '{print $NF}'`

# have we already done the initial setup?
if [ ! -f ./conf/providers.json ]; then
    echo "Performing one-time initialization"
    ./bin/setup-providers $LOGIN_ENDPOINT
fi

./init-actions.sh

CFC_WITH_AUTHZ="checkForCompletion-with-authz"
$WSK api-experimental delete "/${PACKAGE}" /checkForCompletion 2>&1 | grep -v "does not exist"
$WSK api-experimental create "/${PACKAGE}" /checkForCompletion post "${PACKAGE}/${CFC_WITH_AUTHZ}" 2>&1 | grep -v "already exists"
