# update_knowledgebase.ps1
# WHY: knowledgebase.html has hardcoded nav-links in the sidebar VERSION HISTORY section.
#      After moving/adding new doc folders, those new folders are missing from the sidebar.
#      This script injects ALL missing folders so the dynamic date-grouping JS works
#      on a complete, authoritative list.
# WHAT: 
#   1. Reads all budolecosystem_docs_* folders from the documentation directory
#   2. Finds which ones are NOT yet in the knowledgebase.html sidebar
#   3. Inserts the missing nav-link entries before the closing </div></div> of the nav-section
#   4. Updates the knowledgebase.html in-place
# USAGE: Run from the documentation directory:
#         powershell -ExecutionPolicy Bypass -File update_knowledgebase.ps1

$docDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$kbFile = Join-Path $docDir "knowledgebase.html"

# Load existing content
$content = [System.IO.File]::ReadAllText($kbFile, [System.Text.Encoding]::UTF8)
Write-Host "Loaded knowledgebase.html ($([math]::Round($content.Length/1024))KB)"

# Extract all folder names already linked
$existingLinks = [regex]::Matches($content, 'href="(budolecosystem_docs_[^/"]+)/index\.html"') |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique

Write-Host "Already linked in HTML: $($existingLinks.Count)"

# Get all folders on disk sorted newest-first
$allFolders = Get-ChildItem -Path $docDir -Directory |
    Where-Object { $_.Name -match "^budolecosystem_docs_" } |
    Select-Object -ExpandProperty Name |
    Sort-Object -Descending

Write-Host "Folders on disk: $($allFolders.Count)"

# Find missing  
$missing = $allFolders | Where-Object { $existingLinks -notcontains $_ }
Write-Host "Missing from HTML: $($missing.Count)"

if ($missing.Count -eq 0) {
    Write-Host "Nothing to add. HTML is already up to date!" -ForegroundColor Green
    exit 0
}

# Build the HTML block to insert
# Insert BEFORE the anchor where the existing nav-links for version history end
# The last nav-link block ends with:  </a>\n    </div>\n  </div>
# We find the insertion point: just before "    </div>\n  </div>\n\n  <div class=""main-content"""

$sb = [System.Text.StringBuilder]::new()
foreach ($folder in $missing) {
    # Extract version label from folder name (e.g. "budolecosystem_docs_2026-02-28_v9" -> "v9")
    $versionLabel = if ($folder -match '_([^_]+)$') { $Matches[1] } else { $folder }
    [void]$sb.AppendLine("      <a href=""$folder/index.html"" class=""nav-link"" title=""Release documentation for $versionLabel"">")
    [void]$sb.AppendLine("        <div style=""font-weight:600; color:#42526E;"">$versionLabel</div>")
    [void]$sb.AppendLine("        <div style=""font-size:0.8rem; color:#6B778C; line-height:1.2;"">Release documentation for $versionLabel</div>")
    [void]$sb.AppendLine("      </a>")
}

$insertBlock = $sb.ToString()

# Find the closing tags after the last nav-link (before main-content div)
# Pattern: the section closes with two consecutive </div> before <div class="main-content">
$insertionMarker = '    </div>' + "`r`n" + '  </div>' + "`r`n" + "`r`n" + '  <div class="main-content">'
$altMarker = '    </div>' + "`n" + '  </div>' + "`n" + "`n" + '  <div class="main-content">'

$insertionPoint = $content.IndexOf($insertionMarker)
if ($insertionPoint -lt 0) {
    $insertionPoint = $content.IndexOf($altMarker)
    $markerUsed = $altMarker
} else {
    $markerUsed = $insertionMarker
}

if ($insertionPoint -lt 0) {
    Write-Host "ERROR: Could not find insertion point in knowledgebase.html!" -ForegroundColor Red
    Write-Host "Looking for a pattern like: closing div tags before main-content"
    exit 1
}

Write-Host "Found insertion point at char position: $insertionPoint"

# Insert the new links BEFORE the closing tags
$newContent = $content.Substring(0, $insertionPoint) + $insertBlock + $content.Substring($insertionPoint)

# Update the Latest Release section card to point to the most recent folder
$latestFolder = $allFolders[0]
$latestVersion = if ($latestFolder -match '_([^_]+)$') { $Matches[1] } else { $latestFolder }
$latestDate = if ($latestFolder -match '_(\d{4}-\d{2}-\d{2})_') { $Matches[1] } else { "2026-02-28" }
Write-Host "Latest folder: $latestFolder (version: $latestVersion, date: $latestDate)"

# Save updated file
[System.IO.File]::WriteAllText($kbFile, $newContent, [System.Text.Encoding]::UTF8)
Write-Host ""
Write-Host "SUCCESS: Updated knowledgebase.html" -ForegroundColor Green
Write-Host "  Added $($missing.Count) new nav-links" -ForegroundColor Cyan
Write-Host "  Total linked folders in HTML: $($existingLinks.Count + $missing.Count)" -ForegroundColor Cyan

# Verify
$verifyContent = [System.IO.File]::ReadAllText($kbFile, [System.Text.Encoding]::UTF8)
$verifyLinks = [regex]::Matches($verifyContent, 'href="(budolecosystem_docs_[^/"]+)/index\.html"') |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique
Write-Host "  Verification count: $($verifyLinks.Count) unique folders now linked" -ForegroundColor Yellow
