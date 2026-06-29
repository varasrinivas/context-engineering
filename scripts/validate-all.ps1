# validate-all.ps1 — Run validation on all built modules
# Usage: .\scripts\validate-all.ps1

$htmlPath = "course\index.html"

if (-not (Test-Path $htmlPath)) {
    Write-Host "ERROR: $htmlPath not found" -ForegroundColor Red
    exit 1
}

$html = Get-Content $htmlPath -Raw -Encoding UTF8

# Extract all module IDs from MODS array
$moduleIds = [regex]::Matches($html, '"id":\s*"(M\d{2})"') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique

Write-Host ""
Write-Host "═══ BATCH VALIDATION ═══" -ForegroundColor Cyan
Write-Host "Found $($moduleIds.Count) modules: $($moduleIds -join ', ')" 
Write-Host ""

$passCount = 0
$failCount = 0

foreach ($mid in $moduleIds) {
    Write-Host "─── Validating $mid ───" -ForegroundColor DarkGray
    & .\scripts\validate-module.ps1 -ModuleId $mid
    if ($LASTEXITCODE -eq 0) { $passCount++ } else { $failCount++ }
    Write-Host ""
}

Write-Host "═══ BATCH SUMMARY ═══" -ForegroundColor Cyan
Write-Host "  Passed: $passCount" -ForegroundColor Green
Write-Host "  Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host "  Total:  $($moduleIds.Count)"
Write-Host ""
