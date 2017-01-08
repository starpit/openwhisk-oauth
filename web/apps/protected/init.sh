#!/usr/bin/env bash

. ../../../conf/config.sh
. ~/.wskprops

# take the page name from the name of the current directory
PAGE=${PWD##*/}

BASE_ACTION="protectedAction"
wsk action update ${BASE_ACTION} protectedAction.js
echo -n "."

PROTECTED_ACTION=`../../../bin/with-authn ${BASE_ACTION}`
echo -n "."

PROTECTED_ACTION_ENDPOINT_METHOD="post"
wsk api-experimental create /demo /${BASE_ACTION} "${PROTECTED_ACTION_ENDPOINT_METHOD}" "$PROTECTED_ACTION" 2>&1 | grep -v "already exists under path"
echo -n "."

PROTECTED_ACTION_ENDPOINT=`wsk api-experimental list /demo | grep ${BASE_ACTION} | awk '{print $NF}'`
echo -n "."

# find the LOGIN_URL
export OS_HOME=${OS_HOME-~/git/whisk/openwhisk-objectstore}
export OS_AUTH=${OS_AUTH-`${OS_HOME}/util/getAuthToken.sh`}
PUBLIC_CONTAINER_ID=`wsk action invoke objectstore/getContainerID -p container public -p authToken "${OS_AUTH}" -b -r | jq --raw-output .id`
LOGIN_URL="https://dal.objectstorage.open.softlayer.com/v1/AUTH_${PUBLIC_CONTAINER_ID}/public/login.html"

# cheapskate templating
sed -e "s#{ACTION_ENDPOINT_METHOD}#${PROTECTED_ACTION_ENDPOINT_METHOD}#g" \
    -e "s#{ACTION_ENDPOINT}#${PROTECTED_ACTION_ENDPOINT}#g" \
    -e "s#{LOGIN_URL}#${LOGIN_URL}#g" \
    templates/${PAGE}.js > build/${PAGE}.js
echo "."

sed -e '/{CSS}/ {' -e 'r ../../common/common.css' -e 'd' -e '}' \
    -e '/{JS}/ {' -e "r build/${PAGE}.js" -e 'd' -e '}' \
    templates/${PAGE}.html > build/${PAGE}.html
    
../../common/deploy.sh build/${PAGE}.html

echo "ok"
