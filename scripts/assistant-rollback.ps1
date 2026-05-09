<#
.SYNOPSIS
  Restore from .workspace-backups. Default: latest snapshot (LATEST.txt).

.EXAMPLE
  .\scripts\assistant-rollback.ps1
.EXAMPLE
  .\scripts\assistant-rollback.ps1 -BackupName "20260505-143022-before-nav-change"
#>
param(
  [string]$BackupName = ""
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$destRoot = Join-Path $root ".workspace-backups"

if (-not (Test-Path $destRoot)) {
  Write-Error "No backups folder: $destRoot"
}

if (-not $BackupName) {
  $latestFile = Join-Path $destRoot "LATEST.txt"
  if (-not (Test-Path $latestFile)) {
    Write-Error "No LATEST.txt. Pass -BackupName with a folder name under .workspace-backups"
  }
  $BackupName = (Get-Content $latestFile -Raw).Trim()
}

$src = Join-Path $destRoot $BackupName
if (-not (Test-Path $src)) {
  Write-Error "Backup not found: $src"
}

Get-ChildItem -Path $src -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($src.Length).TrimStart("\" , "/")
  $target = Join-Path $root $rel
  $parent = Split-Path $target -Parent
  if ($parent -and -not (Test-Path $parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }
  Copy-Item -Path $_.FullName -Destination $target -Force
}

Write-Host "Restored from: $src"
