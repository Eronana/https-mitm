#!/bin/bash

source .env

help() {
  local function_declare=$(declare -F)
  local function_name=${function_declare//"declare -f "/}
  echo "${function_name//_/-}"
}

clear_cert() {
  rm $CERT_PATH/*
}

clear_data() {
  rm $DATA_PATH/*
}

gen_cert() {
  cd $CERT_PATH
  DOMAIN_NAME=$PROXY_HOST
  openssl genrsa -des3 -out ca.key 4096
  openssl req -x509 -new -nodes -key ca.key -sha256 -days 1024 -out ca.crt
  openssl genrsa -out cert.key 2048
  openssl req -new -sha256 -key cert.key -subj "/C=US/ST=CA/O=MyOrg, Inc./CN=$DOMAIN_NAME" -out cert.csr
  openssl x509 -req -in cert.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out cert.crt -days 500 -sha256
}

eval "${1/-/_}"
