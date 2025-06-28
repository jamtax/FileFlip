# Set working directory to src/ if not already there
Set-Location -Path "$PSScriptRoot\src"

Write-Host "🔍 Scanning for redundant .js/.jsx files..." -ForegroundColor Cyan

# Loop over all .ts/.tsx files to find matching .js/.jsx twins
Get-ChildItem -Recurse -Include *.ts, *.tsx | ForEach-Object {
    $baseName = $_.BaseName
    $dir = $_.DirectoryName

    # Check for .js and .jsx versions
    $jsPath = Join-Path $dir "$baseName.js"
    $jsxPath = Join-Path $dir "$baseName.jsx"

    if (Test-Path $jsPath) {
        Remove-Item -Path $jsPath -Force
        Write-Host "🗑️  Removed duplicate: $jsPath" -ForegroundColor Yellow
    }
    if (Test-Path $jsxPath) {
        Remove-Item -Path $jsxPath -Force
        Write-Host "🗑️  Removed duplicate: $jsxPath" -ForegroundColor Yellow
    }
}

# Remove CRA's react-app-env.d.ts
$craEnv = "react-app-env.d.ts"
if (Test-Path $craEnv) {
    Remove-Item -Path $craEnv -Force
    Write-Host "🧹 Removed legacy file: react-app-env.d.ts" -ForegroundColor Magenta
}

# Add Vite-friendly vite-env.d.ts
$viteEnv = "vite-env.d.ts"
$viteContent = @"
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
"@
Set-Content -Path $viteEnv -Value $viteContent -Encoding UTF8
Write-Host "✅ Created vite-env.d.ts with Vite type declarations." -ForegroundColor Green
