# PowerShell script to create extension icons
# Requires .NET Framework (usually pre-installed on Windows)

$sizes = @(16, 48, 128)
$color1 = "#667eea"
$color2 = "#764ba2"

foreach ($size in $sizes) {
    # Create a simple bitmap
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Create gradient effect (simplified - solid color for now)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(102, 126, 234))
    $graphics.FillRectangle($brush, 0, 0, $size, $size)
    
    # Add text/emoji (simplified)
    $font = New-Object System.Drawing.Font("Arial", ($size * 0.4), [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $graphics.DrawString("KB", $font, $textBrush, ($size * 0.15), ($size * 0.25))
    
    # Save
    $bitmap.Save("$PSScriptRoot\icon$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host "Created icon$size.png"
}

Write-Host "All icons created successfully!"



