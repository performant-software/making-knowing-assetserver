#!/bin/sh
echo " $1"
node  _convert.js --src "$1" > "$1_converted.html"
