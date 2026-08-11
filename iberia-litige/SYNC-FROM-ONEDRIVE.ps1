# Copie le dossier OneDrive local et prepare une archive pour l'agent Cursor.
# NE POUSSE PAS les documents vers GitHub (depot public).
# Double-cliquez ou: powershell -ExecutionPolicy Bypass -File .\SYNC-FROM-ONEDRIVE.ps1

$ErrorActionPreference = "Stop"

$Candidates = @(
  "C:\iberia litige",
  (Join-Path $env:USERPROFILE "OneDrive\Documents\iberia litige"),
  (Join-Path $env:OneDrive "Documents\iberia litige"),
  (Join-Path $env:USERPROFILE "Documents\iberia litige")
) | Where-Object { $_ -and $_.Trim() -ne "" }

$Source = $null
foreach ($c in $Candidates) {
  if (Test-Path -LiteralPath $c) { $Source = $c; break }
}
if (-not $Source) {
  Write-Error ("Dossier introuvable. Chemins testes:`n - " + ($Candidates -join "`n - "))
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
  $RepoRoot = $PSScriptRoot
}

$Dest = Join-Path $RepoRoot "iberia-litige\inbox"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

Write-Host "Source : $Source"
Write-Host "Dest   : $Dest"

Get-ChildItem -LiteralPath $Dest -Force | Where-Object { $_.Name -ne ".gitkeep" } | Remove-Item -Recurse -Force
Copy-Item -LiteralPath (Join-Path $Source "*") -Destination $Dest -Recurse -Force

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$OutDir = Join-Path $env:USERPROFILE "Desktop"
if (-not (Test-Path $OutDir)) { $OutDir = $env:USERPROFILE }
$Zip = Join-Path $OutDir "iberia-litige-$Stamp.zip"
if (Test-Path $Zip) { Remove-Item $Zip -Force }
Compress-Archive -Path (Join-Path $Dest "*") -DestinationPath $Zip -Force

Write-Host ""
Write-Host "OK — archive prete (a NE PAS committer sur le depot public):"
Write-Host "  $Zip"
Write-Host ""
Write-Host "Fichiers copies:"
Get-ChildItem -LiteralPath $Dest -Recurse -File | Select-Object Name, Length | Format-Table -AutoSize
Write-Host "Ensuite: glissez ce ZIP dans le chat de l'agent Cursor"
Write-Host "  https://cursor.com/agents/bc-5128b421-9be3-4c02-b66a-0f295b0d0d8a"
Write-Host "Ou connectez-vous a OneDrive sur le bureau distant de l'agent."

explorer.exe /select,$Zip
