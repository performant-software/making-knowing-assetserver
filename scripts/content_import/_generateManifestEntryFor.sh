#!/bin/bash
FILE="$1"
printf "{'folio':'%s','last_update':'%s'}," $(basename "$1") $(stat -f "%Sm" -t "%m%d%H%M%y" "$1")
