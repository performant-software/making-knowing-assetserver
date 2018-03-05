#!/bin/bash
#set -x
#trap read debug
INFILE="$2"
OUTPATH="$1/$(basename "$(dirname "$2")")"
mkdir -p "$OUTPATH"
OUTFILE="$OUTPATH/$(basename "$INFILE").xml"

# Determine RUNDIR, sensitive to softlinks
# From: https://stackoverflow.com/questions/59895/getting-the-source-directory-of-a-bash-script-from-within
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  RUNDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$RUNDIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
export RUNDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

SELF="$0"

if [ "$INFILE" -nt "$SELF" ]; then
	# 1. extracts the text of the word doc (unzip)
	# 2. strips the word-specific markup using sed
	touch "$INFILE"
	echo " $INFILE"

	# Note: after the first strip, the rest is entity encoded.
	# I tried to use an entity decoder tool (recode) but it ate the encoding, causing the UTF8 accent chars to render wrong
	# In the end it was sufficient to replace the gt and lt, because only the HTML seemed encoded... except for ampersands which
	# were weirdly showing up as &amp;amp;
	unzip -p "$INFILE" word/document.xml | sed -e 's/<[^>]\{1,\}>//g; s/[^[:print:]]\{1,\}//g' | sed -e 's/&gt;/>/g' | sed -e 's/&lt;/</g' | sed -e 's/amp;//g' > "$OUTFILE"

#else echo " SKIPPING: $1"
fi
