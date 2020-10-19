#!/bin/bash

# Absolute path to this script, e.g. /home/user/bin/foo.sh
SCRIPT=$(readlink -f "$0")
# Absolute path this script is in, thus /home/user/bin
SCRIPTPATH=$(dirname "$SCRIPT")

SERVICES_DIR="${SCRIPTPATH}/services"
LIBS_DIR="${SCRIPTPATH}/libs"

cd $LIBS_DIR
echo "Building libs [$file]"
npm install

cd $SERVICES_DIR

for file in *; do
    if [ -d "${SERVICES_DIR}/$file" ] && [ "$file" != "virtwallet-resources" ]
    then
        echo "Building service [$file]"
        cd "${SERVICES_DIR}/${file}"
        npm install
        echo "Building service [$file] result: $?"
    fi
done

cd $SCRIPTPATH