#!/bin/bash

# Absolute path to this script, e.g. /home/user/bin/foo.sh
SCRIPT=$(readlink -f "$0")
# Absolute path this script is in, thus /home/user/bin
SCRIPTPATH=$(dirname "$SCRIPT")

SERVICES_DIR="${SCRIPTPATH}/services"

cd $SERVICES_DIR

for file in *; do
    if [ -d "${SERVICES_DIR}/$file" ] && [ "$file" != "virtwallet-resources" ]
    then
        echo "Deploying service [$file]"
        cd "${SERVICES_DIR}/${file}"
        serverless deploy
        echo "Deploying service [$file] result: $?"
    fi
done

cd $SCRIPTPATH