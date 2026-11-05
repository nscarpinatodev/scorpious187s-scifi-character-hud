<#
    build.ps1 — package the module into a Foundry-installable module.zip
    (the same artifact the GitHub release workflow produces). Run from repo root:
        ./build.ps1

    The zip is written entry by entry with forward slashes. Windows PowerShell's
    Compress-Archive writes backslashes, which a Linux Foundry server unpacks as files
    literally named "scripts\module.mjs".
#>
param(
    [string]$Output = "module.zip"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Files/folders that make up the distributable module.
$include = @(
    "module.json",
    "scripts", "styles", "lang", "fonts",
    "README.md", "LICENSE", "CHANGELOG.md"
)

$zip = Join-Path $root $Output
if (Test-Path $zip) { Remove-Item $zip -Force }

$archive = [System.IO.Compression.ZipFile]::Open($zip, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($item in $include) {
        $path = Join-Path $root $item
        if (-not (Test-Path $path)) {
            Write-Warning "Skipping missing item: $item"
            continue
        }
        $files = if ((Get-Item $path).PSIsContainer) { Get-ChildItem $path -Recurse -File } else { Get-Item $path }
        foreach ($file in $files) {
            $entry = $file.FullName.Substring($root.Length).TrimStart('\', '/').Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $entry, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    }
} finally {
    $archive.Dispose()
}

$size = [math]::Round((Get-Item $zip).Length / 1MB, 2)
Write-Host "Built $zip ($size MB)" -ForegroundColor Green
