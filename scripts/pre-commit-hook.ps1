# CyberForge Pre-commit Hook (PowerShell)
# Install: Copy to .git/hooks/pre-commit and make executable

$ErrorActionPreference = "Stop"

Write-Host "🔍 CyberForge: Scanning staged files for vulnerabilities..." -ForegroundColor Cyan

# Get list of staged files
$stagedFiles = git diff --cached --name-only --diff-filter=ACMR | Where-Object { $_ -match '\.(js|ts|py|java|php|rb|go|rs)$' }

if (-not $stagedFiles) {
    Write-Host "✅ No code files to scan" -ForegroundColor Green
    exit 0
}

# Create temp file list
$tempFile = New-TemporaryFile
$stagedFiles | Out-File -FilePath $tempFile.FullName -Encoding utf8

# Run CyberForge scan on staged files only
$scanOutput = cyberforge scan `
    --files-from $tempFile.FullName `
    --format json `
    --output "$env:TEMP\cyberforge-precommit.json" `
    --fail-on-severity high `
    --quick 2>&1

$scanExitCode = $LASTEXITCODE

# Clean up
Remove-Item $tempFile.FullName

if ($scanExitCode -ne 0) {
    Write-Host ""
    Write-Host "❌ CyberForge found security issues in your code!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Yellow
    
    $results = Get-Content "$env:TEMP\cyberforge-precommit.json" | ConvertFrom-Json
    Write-Host "  🔴 Critical: $($results.summary.critical)" -ForegroundColor Red
    Write-Host "  🟠 High: $($results.summary.high)" -ForegroundColor DarkYellow
    Write-Host "  🟡 Medium: $($results.summary.medium)" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "To see details: Get-Content $env:TEMP\cyberforge-precommit.json" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  1. Fix the issues and commit again"
    Write-Host "  2. Use 'git commit --no-verify' to bypass (NOT RECOMMENDED)"
    Write-Host ""
    exit 1
}

Write-Host "✅ No critical security issues found" -ForegroundColor Green
exit 0
