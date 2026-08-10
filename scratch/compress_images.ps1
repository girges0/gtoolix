Add-Type -AssemblyName System.Drawing
$filePath = "static/img/logo.png"
if (Test-Path $filePath) {
    $srcImg = [System.Drawing.Image]::FromFile($filePath)
    
    # Target size: 160x160 (ultra-crisp for 40x40 display up to 4x retina)
    $newW = 160
    $newH = 160
    $destBmp = New-Object System.Drawing.Bitmap($newW, $newH)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.DrawImage($srcImg, 0, 0, $newW, $newH)
    $g.Dispose()
    $srcImg.Dispose()
    
    # Backup original logo
    if (-not (Test-Path "static/img/logo_original.png")) {
        Copy-Item $filePath "static/img/logo_original.png"
    }
    
    $destPath = "static/img/logo.png"
    $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    
    $newSize = (Get-Item $destPath).Length
    Write-Host "Resized logo to 160x160. New file size: $newSize bytes"
}
