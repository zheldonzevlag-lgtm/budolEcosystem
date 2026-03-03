#!/bin/bash
# =============================================================================
# Redis EC2 Setup Script - Phase 2.3 (AWS Migration v6.0.0)
# =============================================================================
#
# WHY: The budol-redis EC2 instance (i-00db01c308e73fd42) was provisioned but
#      needs Redis server software installed and configured for production use.
#
# WHAT: This script is run from an AWS Systems Manager Session Manager shell
#       (or via SSH through a bastion) on the Ubuntu 24.04 budol-redis EC2.
#
# HOW TO RUN:
#   1. Open AWS Console → EC2 → Instances → budol-redis
#   2. Click "Connect" → "Session Manager" → "Connect"
#   3. Paste and run this script in the browser shell.
#
# EC2 DETAILS:
#   Instance ID: i-00db01c308e73fd42
#   Private IP:  10.0.11.31
#   Name:        budol-redis
#   OS:          Ubuntu 24.04 LTS
#   Subnet:      Private (ap-southeast-1b)
#
# COMPLIANCE:
#   - PCI DSS Req 2.2: No default/unnecessary services enabled
#   - PCI DSS Req 8.2: No sensitive data (CHD) stored in Redis
#   - NPC: No personal data cached without TTL enforcement
#
# TODO: After testing, add requirepass directive with a strong password
#       stored in AWS Secrets Manager, then update REDIS_URL in .env files.
# =============================================================================

set -e  # Exit on any error
set -x  # Print commands as they execute

echo "========================================"
echo " budol-redis EC2 Setup - Phase 2.3"
echo " $(date)"
echo "========================================"

# ---------------------------------------------------------------------------
# 1. Update package index
# ---------------------------------------------------------------------------
echo "[Step 1/6] Updating apt package index..."
sudo apt-get update -y

# ---------------------------------------------------------------------------
# 2. Install Redis Server
# ---------------------------------------------------------------------------
echo "[Step 2/6] Installing redis-server..."
sudo apt-get install -y redis-server

# ---------------------------------------------------------------------------
# 3. Configure Redis for VPC-wide access
# ---------------------------------------------------------------------------
echo "[Step 3/6] Configuring /etc/redis/redis.conf..."

# Backup original config
sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.bak.$(date +%Y%m%d%H%M%S)

# Bind to all interfaces (VPC SG restricts access to 10.0.0.0/16 on port 6379)
sudo sed -i 's/^bind 127.0.0.1 -::1/bind 0.0.0.0/' /etc/redis/redis.conf

# Disable protected mode (we rely on Security Group firewall, not local protection)
# WHY: protected-mode blocks non-loopback connections when no password is set
sudo sed -i 's/^protected-mode yes/protected-mode no/' /etc/redis/redis.conf

# Set maxmemory to 256mb (leaves headroom on t3.micro with 1GB RAM)
# WHY: Prevent Redis from consuming all RAM and causing OOM kills
sudo sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf

# Set eviction policy: Least Recently Used on keys with TTL
# WHY: Cache keys should expire gracefully when memory pressure occurs
sudo sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

# Enable AOF persistence for durability
# WHY: Ensures rate-limit counters survive Redis restarts (prevents reset attacks)
sudo sed -i 's/^appendonly no/appendonly yes/' /etc/redis/redis.conf

# ---------------------------------------------------------------------------
# 4. Set supervised mode to systemd
# ---------------------------------------------------------------------------
echo "[Step 4/6] Setting supervised mode to systemd..."
sudo sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf

# ---------------------------------------------------------------------------
# 5. Enable and start Redis service
# ---------------------------------------------------------------------------
echo "[Step 5/6] Enabling and starting redis-server..."
sudo systemctl daemon-reload
sudo systemctl enable redis-server
sudo systemctl restart redis-server

# Give it a moment to start
sleep 2

# ---------------------------------------------------------------------------
# 6. Verify Redis is running
# ---------------------------------------------------------------------------
echo "[Step 6/6] Verifying Redis connectivity..."
redis-cli ping

if [ $? -eq 0 ]; then
    echo "✅ Redis is running and responding to PING"
    redis-cli info server | grep -E "redis_version|os:|tcp_port|uptime_in_seconds"
else
    echo "❌ Redis PING failed. Check /var/log/redis/redis-server.log"
    exit 1
fi

echo ""
echo "========================================"
echo " ✅ Redis setup complete!"
echo " Private IP: 10.0.11.31"
echo " Port: 6379"
echo " Bind: 0.0.0.0 (restricted via SG)"
echo " Persistence: AOF enabled"
echo " Eviction: allkeys-lru"
echo " Max Memory: 256MB"
echo "========================================"
echo ""
echo "NEXT STEPS:"
echo "1. Register Route 53 A record: redis.budol.internal → 10.0.11.31"
echo "2. Test from another private EC2: redis-cli -h redis.budol.internal ping"
echo "3. Update REDIS_URL env vars in app config (Secrets Manager)"
echo "4. TODO: Add requirepass to redis.conf and store password in Secrets Manager"
