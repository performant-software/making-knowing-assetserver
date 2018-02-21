#!/bin/sh
#set -x
#trap read debug
INFILE="$2"
OUTPATH="$1/$(basename "$(dirname "$2")")"
mkdir -p "$OUTPATH"
OUTFILE="$OUTPATH/$(basename "$INFILE").xml"

# 1. extracts the text of the word doc (unzip)
# 2. strips the word-specific markup using sed
# 3. The result is entity-encoded, so we use 'recode' to put the xml back together
#echo "$OUTFILE";
echo " $INFILE"

# Note: after the first strip, the rest is entity encoded.
# I tried to use an entity decoder tool (recode) but it ate the encoding, causing the UTF8 accent chars to render wrong
# In the end it was sufficient to replace the gt and lt, because only the HTML seemed encoded... except for ampersands which
# were weirdly showing up as &amp;amp;
unzip -p "$INFILE" word/document.xml | sed -e 's/<[^>]\{1,\}>//g; s/[^[:print:]]\{1,\}//g' | sed -e 's/&gt;/>/g' | sed -e 's/&lt;/</g' | sed -e 's/amp;//g' > "$OUTFILE"
