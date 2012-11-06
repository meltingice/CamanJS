#!/bin/bash

./node_modules/buster/bin/buster-server &
sleep 4
phantomjs ./test/phantom.js &