# Copie le dossier OneDrive local vers ce depot Git, puis push.
# Double-cliquez ou: powershell -ExecutionPolicy Bypass -File .\SYNC-FROM-ONEDRIVE.ps1

$ErrorActionPreference = "Stop"

$Source = Join-Path $env:USERPROFILE "OneDrive\Documents\iberia litige"
if (-not (Test-Path -LiteralPath $Source)) {
  $Source = Join-Path $env:OneDrive "Documents\iberia litige"
}
if (-not (Test-Path -LiteralPath $Source)) {
  Write-Error "Dossier introuvable. Verifiez: $env:USERPROFILE\OneDrive\Documents\iberia litige"
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
  $RepoRoot = $PSScriptRoot
}

$Dest = Join-Path $RepoRoot "iberia-litige\inbox"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

Write-Host "Source : $Source"
Write-Host "Dest   : $Dest"

Copy-Item -LiteralPath (Join-Path $Source "*") -Destination $Dest -Recurse -Force

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Zip = Join-Path $RepoRoot "iberia-litige\iberia-litige-$Stamp.zip"
if (Test-Path $Zip) { Remove-Item $Zip -Force }
Compress-Archive -Path (Join-Path $Dest "*") -DestinationPath $Zip -Force

Write-Host "Archive creee: $Zip"
Get-ChildItem -LiteralPath $Dest -Recurse | Select-Object FullName, Length | Format-Table -AutoSize

Push-Location $RepoRoot
try {
  git checkout cursor/iberia-litige-sync-0d8a 2>$null
  git add iberia-litige
  git status
  $pending = git status --porcelain iberia-litige
  if (-not $pending) {
    Write-Host "Aucun nouveau fichier a committer."
    exit 0
  }
  git commit -m "Add Iberia litige documents from OneDrive ($Stamp)"
  git push -u origin cursor/iberia-litige-sync-0d8a
  Write-Host "OK: documents pousses sur origin/cursor/iberia-litige-sync-0d8a"
}
finally {
  Pop-Location
}
