#!/bin/bash
# Bash script to create admin account
# 
# This script runs the Node.js create-admin.js script
# You can customize the admin details by setting environment variables:
#   export ADMIN_EMAIL=admin@example.com
#   export ADMIN_PASSWORD=yourpassword
#   export ADMIN_NAME="Admin Name"

echo "========================================"
echo "   BudolShap - Create Admin Account"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "WARNING: .env file not found!"
    echo "Please create .env file first. See SETUP_ENV.md for details."
    echo ""
fi

# Run the script
echo "Running admin creation script..."
echo ""

node scripts/create-admin.js

echo ""
echo "========================================"

