#!/bin/bash
FILE="$1"

# Default (Darwin)
if [ -z "$(uname -a | grep Ubuntu)" ]; then
	printf "\"%s\":{\"folio\":\"%s\",\"last_update\":\"%s\"}\n" "$(basename "$1")" "$(basename "$1")" "$(stat -f "%Sm" -t "%m%d%H%M%y" "$1")"

# Ubuntu
else
	printf "\"%s\":{\"folio\":\"%s\",\"last_update\":\"%s\"}\n" "$(basename "$1")" "$(basename "$1")" "$(stat -c %Y "$1")"
fi
