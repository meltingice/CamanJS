#!/bin/bash

SERVEDIR_DIR=./test/html
SERVEDIR_PORT=8000
SERVEDIR_PID=./test/server.pid

#TEST_DIR=./test/browser/*.coffee
TEST_DIR=./test/browser/sanity.coffee

# First, start servedir
./node_modules/servedir/bin/servedir $SERVEDIR_DIR $SERVEDIR_PORT &
echo $! > $SERVEDIR_PID

# Copy CamanJS into our server dir for hosting
cp ./dist/caman.full.js "${SERVEDIR_DIR}/js/"
cp ./node_modules/mocha/mocha.js "${SERVEDIR_DIR}/js/"
cp ./node_modules/chai/chai.js "${SERVEDIR_DIR}/js/"

# Wait a sec
sleep 1

# Fire up mocha
./node_modules/mocha/bin/mocha --compilers coffee:coffee-script $TEST_DIR

# Kill the server
kill $(cat $SERVEDIR_PID)

# Cleanup
rm $SERVEDIR_PID
rm "${SERVEDIR_DIR}/js/caman.full.js"