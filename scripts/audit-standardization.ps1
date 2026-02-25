$ErrorActionPreference = 'Stop'

Write-Host '== Audit: Shared contracts standardization ==' -ForegroundColor Cyan

$hasErrors = $false

function Check-Pattern {
  param(
    [string]$Title,
    [string]$Pattern,
    [string]$Path = 'src',
    [string]$Glob = '*.ts',
    [bool]$FailIfFound = $true
  )

  Write-Host "`n[$Title]" -ForegroundColor Yellow
  $results = rg -n --glob $Glob $Pattern $Path 2>$null

  if ($LASTEXITCODE -eq 0 -and $results) {
    $results | ForEach-Object { Write-Host $_ }
    if ($FailIfFound) {
      $script:hasErrors = $true
      Write-Host 'Result: FAIL' -ForegroundColor Red
    } else {
      Write-Host 'Result: WARN' -ForegroundColor DarkYellow
    }
    return
  }

  Write-Host 'Result: OK' -ForegroundColor Green
}

Check-Pattern -Title 'Non-standard shared imports' -Pattern "from '@shared/common/interfaces'|from '@shared/common/" -FailIfFound $true
Check-Pattern -Title 'Legacy pagination key' -Pattern 'hasPreviousPage' -Path 'src/modules' -FailIfFound $true
Check-Pattern -Title 'Legacy sort aliases (monitor)' -Pattern 'sort_by|sort_order' -Path 'src/modules' -Glob '*.dto.ts' -FailIfFound $false
Check-Pattern -Title 'Inline pagination metadata (monitor)' -Pattern 'meta:\s*\{|pagination:\s*\{' -Path 'src/modules' -FailIfFound $false

if ($hasErrors) {
  Write-Host "`nAudit finished with blocking issues." -ForegroundColor Red
  exit 1
}

Write-Host "`nAudit finished without blocking issues." -ForegroundColor Green

