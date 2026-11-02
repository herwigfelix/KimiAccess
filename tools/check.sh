#!/bin/bash
# Prüft den aktuellen kimi-Tab: unbehandelte Klickflächen + unbenannte AX-Knoten
cd "$(dirname "$0")"
echo "== Klickflächen ohne Rolle (nicht vom Plugin erfasst):"; node cdp.mjs eval @audit.js
echo "== AX-Knoten ohne Namen:"; ONLY=1 node cdp.mjs ax
