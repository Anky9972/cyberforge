#!/bin/bash
# CyberForge Pre-commit Hook
# Install: Copy to .git/hooks/pre-commit and make executable

set -e

echo "🔍 CyberForge: Scanning staged files for vulnerabilities..."

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(js|ts|py|java|php|rb|go|rs)$' || true)

if [ -z "$STAGED_FILES" ]; then
    echo "✅ No code files to scan"
    exit 0
fi

# Create temp file list
TEMP_FILE=$(mktemp)
echo "$STAGED_FILES" > "$TEMP_FILE"

# Run CyberForge scan on staged files only
cyberforge scan \
    --files-from "$TEMP_FILE" \
    --format json \
    --output /tmp/cyberforge-precommit.json \
    --fail-on-severity high \
    --quick

SCAN_EXIT_CODE=$?

# Clean up
rm "$TEMP_FILE"

if [ $SCAN_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ CyberForge found security issues in your code!"
    echo ""
    echo "Summary:"
    jq -r '.summary | "  🔴 Critical: \(.critical // 0)\n  🟠 High: \(.high // 0)\n  🟡 Medium: \(.medium // 0)"' /tmp/cyberforge-precommit.json
    echo ""
    echo "To see details: cat /tmp/cyberforge-precommit.json"
    echo ""
    echo "Options:"
    echo "  1. Fix the issues and commit again"
    echo "  2. Use 'git commit --no-verify' to bypass (NOT RECOMMENDED)"
    echo ""
    exit 1
fi

echo "✅ No critical security issues found"
exit 0
