#!/bin/bash
#set -x
#trap read debug
INFILE="$2"
OUTPATH="$1/$(basename "$(dirname "$2")")"
mkdir -p "$OUTPATH"
OUTFILE="$OUTPATH/$(basename "$INFILE").xml"
FOLIO_OUTPATH=$3
UNKNOWN_OUTPATH=$4

# Determine RUNDIR, sensitive to softlinks
# From: https://stackoverflow.com/questions/59895/getting-the-source-directory-of-a-bash-script-from-within
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  RUNDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$RUNDIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
export RUNDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

touch "$INFILE"

filename=$(basename "$INFILE")
filename="$(cut -d'.' -f1 <<<$filename)"
transcriptionType="$(cut -d'_' -f1 <<<$filename)"
folioID="$(cut -d'_' -f2 <<<$filename)"

# Folios should start with p and be no longer than 5chars
if [[ ${folioID:0:1} == 'p'  && ${#folioID} -le 5  ]]; then
	exportPath="$FOLIO_OUTPATH/$folioID/$transcriptionType";
else
	exportPath="$UNKNOWN_OUTPATH/$folioID";
fi
mkdir -p "$exportPath"

# copy the original file to the folio folder
cp "$INFILE" "$exportPath/original.xml"

# copy file to output folder for further processing
cp "$INFILE" "$OUTFILE"
echo "copying $INFILE to $exportPath/original.xml"
