# budolEcosystem - Environment Setup & Dependency Installer
# This script checks for and installs all necessary software and dependencies for the budolEcosystem.

$ErrorActionPreference = "Stop"

function Write-Host-Color ($Message, $Color) {
    Write-Host "[budolEcosystem] $Message" -ForegroundColor $Color
}

# 1. Check for Administrative Privileges
Write-Host-Color "Checking for Administrative privileges..." "Cyan"
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host-Color "Error: This script must be run as an Administrator." "Red"
    exit 1
}

# 2. Check/Install Chocolatey (Windows Package Manager)
if (-not (Get-Command "choco" -ErrorAction SilentlyContinue)) {
    Write-Host-Color "Chocolatey not found. Installing Chocolatey..." "Yellow"
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
} else {
    Write-Host-Color "Chocolatey is already installed." "Green"
}

# 3. Define Required Software
$software = @(
    @{ name = "git"; chocoName = "git" },
    @{ name = "node"; chocoName = "nodejs-lts" },
    @{ name = "postgres"; chocoName = "postgresql16" }
)

# 4. Install Missing Software
foreach ($item in $software) {
    if (-not (Get-Command $item.name -ErrorAction SilentlyContinue)) {
        Write-Host-Color "$($item.name) not found. Installing via Chocolatey..." "Yellow"
        choco install $item.chocoName -y
    } else {
        Write-Host-Color "$($item.name) is already installed." "Green"
    }
}

# 5. Refresh Environment Variables
Write-Host-Color "Refreshing environment variables..." "Cyan"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 6. Install Global Node Packages
Write-Host-Color "Checking global Node packages..." "Cyan"
$globalPackages = @("npm", "prisma")
foreach ($pkg in $globalPackages) {
    Write-Host-Color "Installing/Updating global package: $pkg" "Yellow"
    npm install -g $pkg
}

# 7. Project Setup (Install dependencies and generate Prisma client)
$rootPath = $PSScriptRoot
if (Test-Path "$rootPath\budolpay-0.1.0") {
    Write-Host-Color "Navigating to budolpay-0.1.0..." "Cyan"
    cd "$rootPath\budolpay-0.1.0"
    
    Write-Host-Color "Installing project dependencies..." "Yellow"
    npm install --ignore-scripts
    
    Write-Host-Color "Generating Prisma client..." "Yellow"
    npx prisma generate
}

# 8. Environment File Check
if (-not (Test-Path "$rootPath\budolpay-0.1.0\.env")) {
    Write-Host-Color "Warning: .env file missing in budolpay-0.1.0. Creating template..." "Red"
    "DATABASE_URL='postgresql://johndoe:randompassword@localhost:5432/budolpay_db?schema=public'" | Out-File -FilePath "$rootPath\budolpay-0.1.0\.env" -Encoding utf8
}

Write-Host-Color "Environment setup complete! You are ready to develop on budolEcosystem." "Green"
