<#
.SYNOPSIS
  Snapshot project files before delete/update. Uses .workspace-backups/ (gitignored).

.EXAMPLE
  .\scripts\assistant-backup.ps1
.EXAMPLE
  .\scripts\assistant-backup.ps1 -Paths "app\layout.tsx","src\components\Scanner.tsx" -Label "before-nav-change"
#>
param(
  [string[]]$Paths = @(),
  [string]$Label = "checkpoint"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$safeLabel = ($Label -replace '[^\w\-]+', '-').Trim('-')
if (-not $safeLabel) { $safeLabel = "checkpoint" }
$backupName = "$ts-$safeLabel"
$destRoot = Join-Path $root ".workspace-backups"
$dest = Join-Path $destRoot $backupName
New-Item -ItemType Directory -Force -Path $dest | Out-Null

function Copy-RelPath {
  param([string]$Rel)
  $full = Join-Path $root $Rel
  if (-not (Test-Path $full)) {
    Write-Warning "Skip missing: $Rel"
    return
  }
  $target = Join-Path $dest $Rel
  $parent = Split-Path $target -Parent
  if ($parent -and -not (Test-Path $parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }
  Copy-Item -Path $full -Destination $target -Recurse -Force
}

if ($Paths.Count -eq 0) {
  # Full project snapshot excluding heavy / ignored dirs
  $exclude = @("node_modules", ".next", "out", "build", ".git", ".workspace-backups", "coverage")
  Get-ChildItem -Path $root -Force | ForEach-Object {
    if ($exclude -contains $_.Name) { return }
    Copy-RelPath $_.Name
  }
} else {
  foreach ($p in $Paths) {
    $norm = $p -replace "/", "\"
    Copy-RelPath $norm
  }
}

$pointer = Join-Path $destRoot "LATEST.txt"
Set-Content -Path $pointer -Value $backupName -Encoding utf8
Write-Host "Backup: $dest"
Write-Host "Latest marker: $pointer -> $backupName"
