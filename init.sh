#!/usr/bin/env bash

export WSK="${WSK-wsk}"

. ./conf/config.sh

npm install >& /dev/null

WSK_NAMESPACE=`node -e '{C=require(process.argv[1]); console.log(C.OrganizationFields.Name + "_" + C.SpaceFields.Name) }' ~/.cf/config.json`

./init-login.sh
#$WSK api-experimental delete "/${PACKAGE}" "/${ACTION}" 2>&1 | grep -v "does not exist"
#$WSK api-experimental create "/${PACKAGE}" "/${ACTION}" get "${PACKAGE}/${ACTION}" 2>&1
#LOGIN_ENDPOINT=`$WSK api-experimental list "/${PACKAGE}" | grep "${ACTION}" | awk '{print $NF}'`
LOGIN_ENDPOINT="https://openwhisk.ng.bluemix.net/api/v1/experimental/web/${WSK_NAMESPACE}/${PACKAGE}/${ACTION}"

# have we already done the initial setup?
if [ ! -f ./conf/providers.json ]; then
    echo "Performing one-time initialization"
    ./bin/setup-providers $LOGIN_ENDPOINT
fi

./init-actions.sh

#CFC_WITH_AUTHZ="checkForCompletion-with-authz"
#$WSK action update ${PACKAGE}/${CFC_WITH_AUTHZ} -a web-export true
#$WSK api-experimental delete "/${PACKAGE}" /checkForCompletion 2>&1 | grep -v "does not exist"
#$WSK api-experimental create "/${PACKAGE}" /checkForCompletion post "${PACKAGE}/${CFC_WITH_AUTHZ}" 2>&1 | grep -v "already exists"
