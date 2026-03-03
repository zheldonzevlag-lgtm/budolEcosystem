#!/bin/bash
# Budol Ecosystem - Multi-Domain SSL Setup Script (Let's Encrypt)
# Purpose: Automates certificate issuance for DuckDNS and FreeDNS domains
# Supporting: budolws, budolid, budolpay, budolaccounting
# target OS: Ubuntu 24.04 (EC2)

set -e

# --- Configuration ---
EMAIL="admin@budolecosystem.com"
DUCKDNS_TOKEN_FILE="/etc/letsencrypt/duckdns.token"

# List of DuckDNS domains to secure (excluding WebSocket which is usually handled separately)
DUCKDNS_DOMAINS=("budolid.duckdns.org" "budolpay.duckdns.org")

# FreeDNS domains (Requires Nginx or manual DNS)
FREEDNS_DOMAINS=("budolaccounting.mooo.com")

echo "🔐 Starting Multi-Domain SSL Setup..."

# 1. Install Certbot & DuckDNS Plugin
echo "📦 Installing Certbot and plugins..."
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Install DuckDNS plugin via pip (since it's often not in apt)
sudo apt-get install -y python3-pip
sudo pip3 install certbot-dns-duckdns --break-system-packages

# 2. Setup DuckDNS Token
if [ ! -f "$DUCKDNS_TOKEN_FILE" ]; then
    echo "⚠️ DuckDNS token file not found at $DUCKDNS_TOKEN_FILE"
    read -p "Please enter your DuckDNS Token: " USER_TOKEN
    echo "$USER_TOKEN" | sudo tee "$DUCKDNS_TOKEN_FILE" > /dev/null
    sudo chmod 600 "$DUCKDNS_TOKEN_FILE"
fi

# 3. Issue DuckDNS Certificates (DNS-01)
echo "🦆 Issuing certificates for DuckDNS domains..."
for DOMAIN in "${DUCKDNS_DOMAINS[@]}"; do
    echo "Processing $DOMAIN..."
    sudo certbot certonly --non-interactive --agree-tos -m "$EMAIL" \
        --manual --preferred-challenges dns --authenticator dns-duckdns \
        --dns-duckdns-token-file "$DUCKDNS_TOKEN_FILE" \
        --dns-duckdns-propagation-seconds 60 \
        -d "$DOMAIN"
done

# 4. Issue FreeDNS Certificates (HTTP-01)
echo "🌐 Issuing certificates for FreeDNS domains..."
for DOMAIN in "${FREEDNS_DOMAINS[@]}"; do
    echo "Processing $DOMAIN (Requires Nginx)..."
    if systemctl is-active --quiet nginx; then
        sudo certbot certonly --nginx --non-interactive --agree-tos -m "$EMAIL" -d "$DOMAIN"
    else
        echo "❌ Nginx is not running. Skipping HTTP-01 for $DOMAIN."
        echo "💡 Hint: sudo systemctl start nginx"
    fi
done

# 5. Summary
echo "✅ SSL Issuance complete!"
sudo certbot certificates
echo "🚀 Reminder: Update your Nginx or Load Balancer configs to use these paths:"
echo "/etc/letsencrypt/live/<domain>/fullchain.pem"
echo "/etc/letsencrypt/live/<domain>/privkey.pem"
