# Copie C:\fincut vers le depot local et prepare une archive pour l'agent Cursor.
# NE POUSSE PAS les documents vers GitHub (depot public).
# Double-cliquez ou:
#   powershell -ExecutionPolicy Bypass -File .\SYNC-FROM-WINDOWS.ps1

$ErrorActionPreference = "Stop"

$Candidates = @(
  "C:\fincut",
  (Join-Path $env:USERPROFILE "fincut"),
  (Join-Path $env:USERPROFILE "OneDrive\fincut"),
  (Join-Path $env:USERPROFILE "OneDrive\Documents\fincut"),
  (Join-Path $env:OneDrive "fincut"),
  (Join-Path $env:OneDrive "Documents\fincut")
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

$Dest = Join-Path $RepoRoot "fincut\inbox"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

Write-Host "Source : $Source"
Write-Host "Dest   : $Dest"

Get-ChildItem -LiteralPath $Dest -Force | Where-Object { $_.Name -ne ".gitkeep" } | Remove-Item -Recurse -Force
Copy-Item -LiteralPath (Join-Path $Source "*") -Destination $Dest -Recurse -Force

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$OutDir = Join-Path $env:USERPROFILE "Desktop"
if (-not (Test-Path $OutDir)) { $OutDir = $env:USERPROFILE }
$Zip = Join-Path $OutDir "fincut-$Stamp.zip"
if (Test-Path $Zip) { Remove-Item $Zip -Force }
Compress-Archive -Path (Join-Path $Dest "*") -DestinationPath $Zip -Force

Write-Host ""
Write-Host "OK — archive prete (a NE PAS committer sur le depot public):"
Write-Host "  $Zip"
Write-Host ""
Write-Host "Fichiers copies:"
Get-ChildItem -LiteralPath $Dest -Recurse -File | Select-Object FullName, Length | Format-Table -AutoSize
Write-Host "Ensuite: glissez ce ZIP dans le chat de l'agent Cursor"
Write-Host "  https://cursor.com/agents/bc-92c6019c-00ef-4712-9842-00c19fffa158"

explorer.exe /select,$Zip
