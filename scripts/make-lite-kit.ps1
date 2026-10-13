# Builds design-kit/cr-design-kit-lite.zip: the same kit with images downscaled so it fits upload limits.
# Run after fetch-cards.mjs and fetch-royaleapi-assets.mjs:  powershell -File scripts/make-lite-kit.ps1
Add-Type -AssemblyName System.Drawing
$kit = Join-Path $PSScriptRoot '..\design-kit' | Resolve-Path
$out = Join-Path $kit 'lite'
if (Test-Path $out) { Remove-Item $out -Recurse -Force }

function Resize-Folder($from, $to, $maxSize, $filter = '*.png') {
    New-Item -ItemType Directory -Force $to | Out-Null
    foreach ($f in Get-ChildItem $from -Filter $filter) {
        $img = [System.Drawing.Image]::FromFile($f.FullName)
        $scale = [Math]::Min(1.0, [double]$maxSize / [Math]::Max($img.Width, $img.Height))
        # Re-encoding an already-small PNG makes it bigger, so copy those as-is
        if ($scale -ge 1.0) { $img.Dispose(); Copy-Item $f.FullName (Join-Path $to $f.Name); continue }
        $w = [int]($img.Width * $scale); $h = [int]($img.Height * $scale)
        $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($img, 0, 0, $w, $h)
        $bmp.Save((Join-Path $to $f.Name), [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose(); $bmp.Dispose(); $img.Dispose()
    }
}

New-Item -ItemType Directory -Force $out | Out-Null
Copy-Item "$kit\cards.md", "$kit\cards.csv" $out
Copy-Item "$kit\moodboard" "$out\moodboard" -Recurse
# Sizes keep the zip under a 20 MB upload limit
foreach ($d in 'cards', 'evolutions', 'heroes', 'tower-troops') { Resize-Folder "$kit\images\$d" "$out\images\$d" 140 }
Resize-Folder "$kit\royaleapi\cards" "$out\royaleapi\cards" 140 '*-hero-ev1.png'   # only the combined hero+evo art
Resize-Folder "$kit\royaleapi\characters" "$out\royaleapi\characters" 256
foreach ($d in 'leagues', 'arenas', 'chests', 'misc') { Resize-Folder "$kit\royaleapi\$d" "$out\royaleapi\$d" 128 }
Resize-Folder "$kit\royaleapi\clan-badges" "$out\royaleapi\clan-badges" 72

$zip = Join-Path $kit 'cr-design-kit-lite.zip'
Compress-Archive -Path "$out\*" -DestinationPath $zip -Force
Remove-Item $out -Recurse -Force
'{0:N1} MB  {1}' -f ((Get-Item $zip).Length / 1MB), $zip
