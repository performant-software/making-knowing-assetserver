#!/bin/sh


# 1. extracts the text of the word doc (unzip)
# 2. strips the word-specific markup using sed
# 3. The result is entity-encoded, so we use 'recode' to put the xml back together
echo "$1";

cat "$1"
#unzip -p "$INFILE" | sed -e 's/<[^>]\{1,\}>//g; s/[^[:print:]]\{1,\}//g' | recode html..utf8 > "$OUTFILE"
