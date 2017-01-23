#!/usr/bin/env bash

export WSK="${WSK-wsk}"

. ./conf/config.sh

#
# set up the package and the login action
#
$WSK package create "${PACKAGE}" 2>&1 | grep -v "resource already exists"
$WSK action update --kind nodejs:6 "${PACKAGE}/${ACTION}" "actions/${ACTION}/${ACTION}.js"

