#!/usr/bin/env bash

. ./conf/config.sh


#
# Update the package with the providers configuration
#    also, since wsk package update overwrites any not-specified key-value pairs, we have
#          to make sure to keep any ACLs in place!
#
PROVIDERS=`cat conf/providers.json`
ACL=`wsk package get "${PACKAGE}" | grep -v "got package ${PACKAGE}" | jq -c '.parameters[] | select(.key | contains("acl")) .value'`
if [ "$ACL" == '""' ] || [ -z "$ACL" ]; then
    if [ -f conf/acl.json ]; then
	ACL=`cat conf/acl.json`
	if [ -z "$ACL" ]; then
	    ACL="{}"
	fi
    fi
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
       wsk action update --kind nodejs:6 "${PACKAGE}/${action}" "${dir}/${action}.js" &
    fi
done

wait


#
# checkForCompletion, with authorization check!
#
CFC_WITH_AUTHZ="checkForCompletion-with-authz"
wsk action update --sequence "${PACKAGE}/${CFC_WITH_AUTHZ}" "${PACKAGE}/checkForCompletion","${PACKAGE}/validate"
