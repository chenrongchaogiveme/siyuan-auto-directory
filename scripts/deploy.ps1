param(
    [string]$Target = "C:\MyDocument\SiYuan\data\plugins\siyuan-auto-directory"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path -LiteralPath $Target)) {
    throw "SiYuan plugin directory not found: $Target"
}

$rootPath = (Resolve-Path -LiteralPath $root).Path
$targetPath = (Resolve-Path -LiteralPath $Target).Path
if ($rootPath -eq $targetPath) {
    throw "Deploy target is the source directory. Choose the installed plugin directory instead."
}

npm run build
if ($LASTEXITCODE -ne 0) {
    throw "npm run build failed"
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

$folders = @("i18n")

foreach ($file in $files) {
    $source = Join-Path $root $file
    if (-not (Test-Path -LiteralPath $source)) {
        throw "Missing deploy file: $file"
    }
    Copy-Item -LiteralPath $source -Destination $targetPath -Force
}

foreach ($folder in $folders) {
    $source = Join-Path $root $folder
    if (-not (Test-Path -LiteralPath $source -PathType Container)) {
        throw "Missing deploy folder: $folder"
    }
    $destination = Join-Path $targetPath $folder
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    Copy-Item -Path (Join-Path $source "*") -Destination $destination -Force
}

Write-Host "Deployed to $targetPath"
Write-Host "Reload the plugin in SiYuan (disable/enable) or restart SiYuan to see changes."