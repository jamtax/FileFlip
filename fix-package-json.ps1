# Define path to package.json
$packageJsonPath = "package.json"

# Read as raw text and clean up invalid artifacts
$packageRaw = Get-Content $packageJsonPath -Raw
$packageRaw = $packageRaw -replace '`n', ''

# Convert to JSON object
try {
    $json = $packageRaw | ConvertFrom-Json
} catch {
    Write-Host "❌ Failed to parse package.json. Please review manually."
    exit 1
}

# Ensure scripts block exists
if (-not $json.PSObject.Properties.Name.Contains("scripts")) {
    $json | Add-Member -MemberType NoteProperty -Name scripts -Value (@{})
}

# Add or update the lint script safely
$json.scripts.lint = "eslint ."

# Convert back to JSON with indentation and save
$json | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath

Write-Host "✅ package.json repaired and lint script updated successfully."
