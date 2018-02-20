#!/bin/sh
#set -x
#trap read debug

# Determine RUNDIR, sensitive to softlinks
# From: https://stackoverflow.com/questions/59895/getting-the-source-directory-of-a-bash-script-from-within
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  RUNDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$RUNDIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
export RUNDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

# Set up environment and temp dirs for processing
#INFOLDER="$RUNDIR/temp/input"
OUTFOLDER="$RUNDIR/temp/output"
mkdir -p "$OUTFOLDER"
#mkdir -p "$INFOLDER"

#Download all the word documents
#cp "$RUNDIR/sourceFiles/"*.docx "$INFOLDER"

# Extract the XML from out of the word documents in the folder
##find ../samples/*.docx -type f -exec "$RUNDIR/_extract.sh" "$OUTFOLDER" {} \;
find ./sourceFiles/ -name *.docx -type f -exec "$RUNDIR/_extract.sh" "$OUTFOLDER" {} \;

# Convert the extracted files to our format
#find "$OUTFOLDER" -name *.xml -type f -exec "$RUNDIR/_convert.sh" {} \;
