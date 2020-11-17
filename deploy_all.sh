#!/bin/bash

# Absolute path to this script, e.g. /home/user/bin/foo.sh
SCRIPT=$(readlink -f "$0")
# Absolute path this script is in, thus /home/user/bin
SCRIPTPATH=$(dirname "$SCRIPT")

SERVICES_DIR="${SCRIPTPATH}/services"

TARGET_ENV=${1-dev}

cd $SERVICES_DIR

function deployService {
    service=$1
    echo "Deploying service [$service]"
    cd "${SERVICES_DIR}/${service}"
    serverless deploy -s $TARGET_ENV -r eu-west-1
    echo "Deploying service [$service] result: $?"
}

deployService virtwallet-resources
deployService account
deployService account-change-set
deployService category
deployService categoryRule
deployService data-exporter
deployService wallet
deployService metrics
deployService parser-router
deployService request-file-upload
deployService transaction
deployService transaction-classifier
deployService transaction-exporter
deployService transaction-loader
deployService ulster-statement-csv-parser

cd $SCRIPTPATH