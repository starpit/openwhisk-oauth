#!/usr/bin/env bash

. ./conf/config.sh

action=login

wsk api-experimental create "/${PACKAGE}" "/${action}" get "${PACKAGE}/${action}"
