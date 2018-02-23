#!/bin/bash

# Determine RUNDIR, sensitive to softlinks
# From: https://stackoverflow.com/questions/59895/getting-the-source-directory-of-a-bash-script-from-within
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  RUNDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$RUNDIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
export RUNDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"


FOLIO_DIRECTORY="$1"
MANIFEST_FILE="$2"
rm -rf $MANIFEST_FILE;
echo "[" >> $MANIFEST_FILE
find "$FOLIO_DIRECTORY" -type d -exec "$RUNDIR/_generateManifestEntryFor.sh" {} \; >> $MANIFEST_FILE
echo "]" >> $MANIFEST_FILE
