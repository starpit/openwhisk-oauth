#!/usr/bin/env bash

. ./conf/config.sh

action=login

npm install >& /dev/null

wsk package create "${PACKAGE}" 2>&1 | grep -v "resource already exists"
wsk action delete "${PACKAGE}/${action}" 2>&1 | grep -v "resource does not exist"
wsk action create --kind nodejs:6 "${PACKAGE}/${action}" actions/${action}/${action}.js

# have we already done the initial setup?
wsk api-experimental list "/${PACKAGE}" | grep "${action}" > /dev/null
if [ $? == 1 ]; then
    echo "Performing one-time initialization"
    ./init-apigw.sh
    ./bin/setup-providers
fi

# Update the package with the providers configuration
PROVIDERS=`cat conf/providers.json`
wsk package update "${PACKAGE}" -p providers "${PROVIDERS}"




#for dir in actions/*/; do
#    action=$(basename "$dir")
#    wsk action delete "${PACKAGE}/${action}" 2>&1 | grep -v "resource does not exist"
#    (cd $dir && wsk action create --kind nodejs:6 "${PACKAGE}/${action}" ${action}.js
#    )
#done
