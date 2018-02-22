#!/bin/sh
echo " $1"
node  ./content_import/_convert.js --src "$1" > "$1_converted.html"
