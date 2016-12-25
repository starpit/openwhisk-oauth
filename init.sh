#!/usr/bin/env bash

. ./conf/config.sh

PROVIDERS=`cat conf/providers.json`

npm install >& /dev/null

wsk package create "${PACKAGE}" 2>&1 | grep -v "resource already exists"
wsk package update "${PACKAGE}" -p providers "${PROVIDERS}"

for dir in actions/*/; do
    action=$(basename "$dir")

    wsk action delete "${PACKAGE}/${action}" 2>&1 | grep -v "resource does not exist"
    (cd $dir \
	    && echo "${PACKAGE}/${action}" \
	    && wsk action create --kind nodejs:6 "${PACKAGE}/${action}" ${action}.js;)

    # see if the action needs the full credentials (i.e. including login credentials)
#    if [ -f "$dir/config.json" ]; then
#	C=`cat "$dir/config.json" | jq --raw-output .credentials`
#	if [ "$C" == "full" ]; then
#	    echo "Using full credentials for ${action}"
#	    wsk action update "${PACKAGE}/${action}" -p providers "${PROVIDERS}"
#	fi
#    fi
    
#    rm -f "$dir/node_modules" "$dir/lib"
done
