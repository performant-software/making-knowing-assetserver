#!/bin/sh
#find "./CACHE/output" -name *.html -type f -exec "./_sort.sh" {} \;
OUTPATH="./EXPORT/"
filename=$(basename "$1")
filename="$(cut -d'.' -f1 <<<$filename)"
transcriptionType="$(cut -d'_' -f1 <<<$filename)"
folioID="$(cut -d'_' -f2 <<<$filename)"
exportPath="./folio/$folioID/$transcriptionType";
mkdir -p "$exportPath"
cat "$1" > "$exportPath/index.html"
