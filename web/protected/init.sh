#!/usr/bin/env bash

. ../../conf/config.sh
. ~/.wskprops

# take the page name from the name of the current directory
PAGE=${PWD##*/}

BASE_ACTION="protectedAction"
wsk action update ${BASE_ACTION} protectedAction.js
echo -n "."

PROTECTED_ACTION=`../../bin/with-authn ${BASE_ACTION}`
echo -n "."

PROTECTED_ACTION_ENDPOINT_METHOD="post"
wsk api-experimental create /demo /${BASE_ACTION} "${PROTECTED_ACTION_ENDPOINT_METHOD}" "$PROTECTED_ACTION" 2>&1 | grep -v "already exists under path"
echo -n "."

PROTECTED_ACTION_ENDPOINT=`wsk api-experimental list /demo | grep ${BASE_ACTION} | awk '{print $NF}'`
echo -n "."

# TODO find a way not to hard-code this
LOGIN_ENDPOINT="https://dal.objectstorage.open.softlayer.com/v1/AUTH_8505e32a0c1a48c2b7a37c063adad2ba/public/login.html"

awk -v ACTION_ENDPOINT="${PROTECTED_ACTION_ENDPOINT}" \
    -v ACTION_ENDPOINT_METHOD="${PROTECTED_ACTION_ENDPOINT_METHOD}" \
    -v LOGIN_ENDPOINT="${LOGIN_ENDPOINT}" \
    '{
gsub("{ACTION_ENDPOINT}", ACTION_ENDPOINT);
 gsub("{ACTION_ENDPOINT_METHOD}", ACTION_ENDPOINT_METHOD);
 gsub("{LOGIN_ENDPOINT}", LOGIN_ENDPOINT);
 print $0;
}' ${PAGE}-template.html > ${PAGE}.html
echo "."

../common.sh ${PAGE}.html

echo "ok"
