# register-budolshap-duckdns-task.ps1
# WHY: DuckDNS only supports A records (static IPs), while the AWS ALB rotates IPs dynamically.
#      This script creates a Windows Scheduled Task to auto-update DuckDNS every 5 minutes,
#      ensuring budolshap.duckdns.org always resolves to an active ALB IP.
# USAGE: Run once as Administrator. The task will persist across reboots.
# REQUIRES: DUCKDNS_TOKEN must be passed as an argument.

param(
    [Parameter(Mandatory = $true)]
    [string]$Token
)

$SCRIPT_PATH = Join-Path $PSScriptRoot "update-budolshap-duckdns.ps1"
$TASK_NAME = "BudolShap-DuckDNS-Update"

# WHY: Validate that the script exists before registering
if (-not (Test-Path $SCRIPT_PATH)) {
    Write-Host "[ERROR] Script not found: $SCRIPT_PATH" -ForegroundColor Red
    exit 1
}

# WHY: Remove any existing task to ensure a clean registration
Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false -ErrorAction SilentlyContinue

# WHY: Run every 5 minutes to keep up with ALB IP rotation
$trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 5) -Once -At (Get-Date)
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -WindowStyle Hidden -File `"$SCRIPT_PATH`" `"$Token`""
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 2) -RestartCount 3

Register-ScheduledTask -TaskName $TASK_NAME -Trigger $trigger -Action $action -Settings $settings -RunLevel Highest -Force

Write-Host "" 
Write-Host "Scheduled Task registered: $TASK_NAME" -ForegroundColor Green
Write-Host "  Runs every 5 minutes to keep budolshap.duckdns.org in sync with the ALB." -ForegroundColor Cyan
Write-Host "  Script: $SCRIPT_PATH" -ForegroundColor White

# WHY: Run immediately to confirm it works
Write-Host ""
Write-Host "Running initial update now..." -ForegroundColor Cyan
& $SCRIPT_PATH $Token
