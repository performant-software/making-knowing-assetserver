#!/bin/sh
INFILE="$2"
OUTPATH="$1/$(basename "$(dirname "$2")")"
mkdir -p "$OUTPATH"
OUTFILE="$OUTPATH/$(basename "$INFILE").xml"

# 1. extracts the text of the word doc (unzip)
# 2. strips the word-specific markup using sed
# 3. The result is entity-encoded, so we use 'recode' to put the xml back together
#echo "$OUTFILE";
echo "      ...EXTRACT: $INFILE"
unzip -p "$INFILE" | sed -e 's/<[^>]\{1,\}>//g; s/[^[:print:]]\{1,\}//g' | recode html..utf8 > "$OUTFILE"
