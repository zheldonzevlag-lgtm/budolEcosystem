#!/bin/bash
# Budol Ecosystem - DuckDNS Dynamic DNS Update Script
# Purpose: Updates DuckDNS with the current public IP of the EC2 instance

# --- CONFIGURATION ---
DOMAIN="budolws"
TOKEN="YOUR_DUCKDNS_TOKEN_HERE" # User must replace this
# ---------------------

echo "🔄 Updating DuckDNS domain [${DOMAIN}.duckdns.org]..."

# Perform the update
RESULT=$(curl -s "https://www.duckdns.org/update?domains=${DOMAIN}&token=${TOKEN}&ip=")

if [ "$RESULT" = "OK" ]; then
    echo "✅ DuckDNS update successful: $(date)"
else
    echo "❌ DuckDNS update failed: $RESULT"
    exit 1
fi
