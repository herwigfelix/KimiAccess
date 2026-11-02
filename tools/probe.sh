#!/bin/bash
# probe.sh '<JS-Klick-Ausdruck>' – klickt, wartet, prüft, zeigt neue AX-Knoten, Escape
cd "$(dirname "$0")"
node cdp.mjs ax > /tmp/ka_before.txt 2>/dev/null
node cdp.mjs eval "$1; await new Promise(r=>setTimeout(r,${WAIT:-1500}));" >/dev/null
./check.sh
echo "== Neu im AX-Baum:"; node cdp.mjs ax | diff /tmp/ka_before.txt - | grep '^>' | sed 's/^> //' | head -${N:-60}
[ -z "$KEEP" ] && node cdp.mjs key Escape >/dev/null
