#!/bin/sh
#find "./CACHE/output" -name *.html -type f -exec "./_sort.sh" {} \;
FOLIO_OUTPATH=$1
UNKNOWN_OUTPATH=$2
INFILE=$3

filename=$(basename "$INFILE")
filename="$(cut -d'.' -f1 <<<$filename)"
transcriptionType="$(cut -d'_' -f1 <<<$filename)"
folioID="$(cut -d'_' -f2 <<<$filename)"

if [[ ${folioID:0:1} == 'p' ]]
then
	exportPath="$FOLIO_OUTPATH/$folioID/$transcriptionType";
else
	exportPath="$UNKNOWN_OUTPATH/$folioID";
fi
mkdir -p "$exportPath"
cat "$INFILE" > "$exportPath/index.html"
