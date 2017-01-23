#!/usr/bin/env bash

. ./conf/config.sh

#
# set up the package and the login action
#
wsk package create "${PACKAGE}" 2>&1 | grep -v "resource already exists"
wsk action update --kind nodejs:6 "${PACKAGE}/${ACTION}" "actions/${ACTION}/${ACTION}.js"

