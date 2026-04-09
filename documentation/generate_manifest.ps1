# generate_manifest.ps1
# WHY: Regenerates docs_manifest.js from what actually exists on disk.
#      Ensures knowledgebase.html sidebar is always in sync with real folders.
# WHAT: Scans /documentation/ for all budol* folders, sorts newest-first,
#       groups by YYYY-MM-DD date, writes docs_manifest.js
# USAGE: Run from within the /documentation/ directory:
#         .\generate_manifest.ps1

$docDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Get all doc folders, sorted newest first
$allFolders = Get-ChildItem -Path $docDir -Directory |
    Where-Object { $_.Name -match "^budol" } |
    Select-Object -ExpandProperty Name |
    Sort-Object -Descending

# Group by extracted date
$grouped = [ordered]@{}
foreach ($folder in $allFolders) {
    if ($folder -match '_(\d{4}-\d{2}-\d{2})_') {
        $date = $Matches[1]
    } else {
        $date = "unknown"
    }
    if (-not $grouped.Contains($date)) {
        $grouped[$date] = [System.Collections.Generic.List[string]]::new()
    }
    $grouped[$date].Add($folder)
}

# Build JS content
$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("/**")
[void]$sb.AppendLine(" * docs_manifest.js")
[void]$sb.AppendLine(" * WHY: Provides a complete, authoritative list of all documentation folders")
[void]$sb.AppendLine(" *      so knowledgebase.html can build a fully-populated, date-grouped sidebar")
[void]$sb.AppendLine(" *      without requiring a server-side file API.")
[void]$sb.AppendLine(" * WHAT: Array of folder names sorted newest-first. Each entry maps to a")
[void]$sb.AppendLine(" *       folder under the /documentation/ directory containing index.html.")
[void]$sb.AppendLine(" * GENERATED: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') PH Time")
[void]$sb.AppendLine(" * TOTAL: $($allFolders.Count) documentation folders across $($grouped.Count) dates")
[void]$sb.AppendLine(" * TODO: Re-run this script whenever new documentation folders are added.")
[void]$sb.AppendLine(" */")
[void]$sb.AppendLine("const DOCS_MANIFEST = [")

foreach ($date in $grouped.Keys) {
    [void]$sb.AppendLine("    // $date ($($grouped[$date].Count) versions)")
    foreach ($folder in $grouped[$date]) {
        [void]$sb.AppendLine("    `"$folder`",")
    }
}

[void]$sb.AppendLine("];")

$output = $sb.ToString()
$outPath = Join-Path $docDir "docs_manifest.js"
[System.IO.File]::WriteAllText($outPath, $output, [System.Text.Encoding]::UTF8)

Write-Host "SUCCESS: Generated docs_manifest.js" -ForegroundColor Green
Write-Host "  Total folders: $($allFolders.Count)" -ForegroundColor Cyan
Write-Host "  Date groups: $($grouped.Count)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Date breakdown:" -ForegroundColor Yellow
foreach ($date in $grouped.Keys) {
    Write-Host "  $date : $($grouped[$date].Count) folders"
}
