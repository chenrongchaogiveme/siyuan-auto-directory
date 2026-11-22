$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

npm run build
if ($LASTEXITCODE -ne 0) {
    throw "npm run build failed"
}

$plugin = Get-Content (Join-Path $root "plugin.json") -Raw -Encoding UTF8 | ConvertFrom-Json
if ($plugin.url -match "OWNER|your-github") {
    throw "Replace the placeholder GitHub URL in plugin.json before packaging."
}

$files = @(
    "index.js",
    "index.css",
    "plugin.json",
    "README.md",
    "README.zh-CN.md",
    "LICENSE",
    "icon.png",
    "preview.png"
)

foreach ($file in $files) {
    if (-not (Test-Path (Join-Path $root $file))) {
        throw "Missing required package file: $file"
    }
}

$zipPath = Join-Path $root "package.zip"
if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path $files -DestinationPath $zipPath -CompressionLevel Optimal

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    $entries = @($zip.Entries | ForEach-Object { $_.FullName })
    foreach ($file in $files) {
        if ($entries -notcontains $file) {
            throw "package.zip is missing $file at its root"
        }
    }
} finally {
    $zip.Dispose()
}

$size = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host "Created package.zip ($size KB)"
