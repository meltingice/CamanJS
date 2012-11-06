#!/bin/bash
# just call with ./kill-server buster-server|phantom

function get_buster_server_pid(){
    echo `ps aux|grep buster-server|grep node|awk '{ print $2 }'`
}

function get_phantom_server_pid(){
    echo `ps aux|grep phantomjs|head -1|awk '{ print $2 }'`
}

case "$1" in
  "buster-server") server_pid=`get_buster_server_pid` ;;
  "phantom") server_pid=`get_phantom_server_pid` ;;
  *) kill `get_buster_server_pid` &&
     kill `get_phantom_server_pid`
     ;;
esac


if [ "$server_pid" != "" ] ; then
    kill $server_pid
    echo "$1 killed"
fi