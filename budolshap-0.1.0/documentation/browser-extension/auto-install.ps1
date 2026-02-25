# BudolShap Extension Auto-Installer Script
# This script automates what's possible on Windows

Write-Host "🚀 BudolShap Extension Auto-Installer" -ForegroundColor Cyan
Write-Host ""

$sourcePath = "$PSScriptRoot"
$targetPath = "C:\Program Files\budolshap\browser-extension"

# Check for Administrator privileges
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Please run this script as Administrator to install to Program Files." -ForegroundColor Yellow
    Write-Host "   Setting clipboard to CURRENT path instead..." -ForegroundColor Gray
    $extensionPathFull = (Resolve-Path $sourcePath).Path
}
else {
    Write-Host "📂 Installing to: $targetPath" -ForegroundColor Yellow
    
    # Create directory if it doesn't exist
    if (-not (Test-Path $targetPath)) {
        New-Item -ItemType Directory -Force -Path $targetPath | Out-Null
    }
    
    # Copy files
    Write-Host "🚚 Copying files..." -ForegroundColor Gray
    Copy-Item -Path "$sourcePath\*" -Destination $targetPath -Recurse -Force
    
    $extensionPathFull = $targetPath
    Write-Host "✅ Extension files installed successfully!" -ForegroundColor Green
}

Write-Host "Extension Path: $extensionPathFull" -ForegroundColor Yellow
Write-Host ""

# Copy path to clipboard
$extensionPathFull | Set-Clipboard
Write-Host "✅ Extension path copied to clipboard!" -ForegroundColor Green
Write-Host ""

# Detect browser and open extensions page
Write-Host "🌐 Detecting browser..." -ForegroundColor Cyan

# Check for Chrome
$chromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
$chromePathX86 = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"

# Check for Edge
$edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"

if (Test-Path $chromePath) {
    Write-Host "✅ Chrome detected!" -ForegroundColor Green
    Start-Process $chromePath -ArgumentList "chrome://extensions/"
    Write-Host "📂 Opened Chrome extensions page" -ForegroundColor Green
}
elseif (Test-Path $chromePathX86) {
    Write-Host "✅ Chrome detected (x86)!" -ForegroundColor Green
    Start-Process $chromePathX86 -ArgumentList "chrome://extensions/"
    Write-Host "📂 Opened Chrome extensions page" -ForegroundColor Green
}
elseif (Test-Path $edgePath) {
    Write-Host "✅ Edge detected!" -ForegroundColor Green
    Start-Process $edgePath -ArgumentList "edge://extensions/"
    Write-Host "📂 Opened Edge extensions page" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Browser not detected. Please manually open:" -ForegroundColor Yellow
    Write-Host "   Chrome: chrome://extensions/" -ForegroundColor White
    Write-Host "   Edge: edge://extensions/" -ForegroundColor White
}

Write-Host ""
Write-Host "📋 Next Steps (Manual - Required by Browser Security):" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. ✅ Enable 'Developer mode' (toggle in top-right)" -ForegroundColor White
Write-Host "2. ✅ Click 'Load unpacked'" -ForegroundColor White
Write-Host "3. ✅ Paste the path (already in clipboard):" -ForegroundColor White
Write-Host "   $extensionPathFull" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 The path is already copied to your clipboard!" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to open the auto-installer web page..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open the auto-installer HTML page
$autoInstallerPath = Join-Path $extensionPathFull "auto-installer.html"
if (Test-Path $autoInstallerPath) {
    Start-Process $autoInstallerPath
    Write-Host "✅ Opened auto-installer page!" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Auto-installer HTML not found at: $autoInstallerPath" -ForegroundColor Yellow
}
