#!/bin/bash
# Budol Ecosystem - WebSocket Server Setup Script (EC2)
# Purpose: Automates deployment of Dockerized Socket.io with Nginx Proxy & SSL
# target OS: Ubuntu 24.04

set -e

echo "🚀 Starting WebSocket Server setup..."

# 1. Update & Install Dependencies
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common nginx unattended-upgrades

# 2. Install Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# 3. Create App Directory
mkdir -p ~/budol-ws
cd ~/budol-ws

# 4. Create Docker Compose file
cat <<EOF > docker-compose.yml
version: '3.8'
services:
  websocket-server:
    build: .
    ports:
      - "4000:4000"
    environment:
      - PORT=4000
      - NODE_ENV=production
    restart: always
EOF

# 5. Configure Nginx
echo "🌐 Configuring Nginx Reverse Proxy..."
sudo tee /etc/nginx/sites-available/budol-ws <<EOF
server {
    listen 80;
    server_name _; # Will be replaced by DuckDNS or ws.budol.internal

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/budol-ws /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# 6. Set up DuckDNS Auto-Update
echo "🦆 Configuring DuckDNS Auto-Update..."
cat <<EOF > update_duckdns.sh
#!/bin/bash
DOMAIN="budolws"
TOKEN="YOUR_DUCKDNS_TOKEN_HERE"
curl -s "https://www.duckdns.org/update?domains=\$DOMAIN&token=\$TOKEN&ip="
EOF
chmod +x update_duckdns.sh

# Add to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/\$USER/budol-ws/update_duckdns.sh > /dev/null 2>&1") | crontab -

# 7. Final check
echo "✅ Setup complete! Transfer the websocket-server files and run 'docker compose up -d' in ~/budol-ws"
echo "⚠️ IMPORTANT: Edit ~/budol-ws/update_duckdns.sh with your real token!"
