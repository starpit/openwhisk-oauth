#!/usr/bin/env bash

. ./conf/config.sh

action=login

ROUTE=`wsk api-experimental create "/${PACKAGE}" "/${action}" get "${PACKAGE}/${action}"`

if [ $? == 0 ]; then
    grep -v APIGW conf/config.sh > conf/config.sh
    echo "$ROUTE" >> config/config.sh
fi
