#!/bin/bash
# Simple PR Status Checker
# Usage: ./check-pr-status.sh <pr-number>

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SONARCLOUD_URL="https://sonarcloud.io"
SONARCLOUD_PROJECT_KEY="censeo-io_censeo-v2"

if [ -z "$1" ]; then
    echo -e "${RED}Error: PR number required${NC}"
    echo "Usage: $0 <pr-number>"
    exit 1
fi

PR_NUMBER=$1

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PR #$PR_NUMBER Status Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# GitHub Actions Status
echo -e "${YELLOW}GitHub Actions:${NC}"
gh pr checks "$PR_NUMBER" | head -25
echo ""

# Count status
PENDING=$(gh pr checks "$PR_NUMBER" 2>&1 | grep -c "pending\|in_progress" || true)
FAILED=$(gh pr checks "$PR_NUMBER" 2>&1 | grep -c "fail" || true)
PASSED=$(gh pr checks "$PR_NUMBER" 2>&1 | grep -c "pass" || true)

echo "Summary: $PASSED passed, $FAILED failed, $PENDING pending/in progress"
echo ""

# SonarCloud Status
if [ -n "$SONARCLOUD_TOKEN" ]; then
    echo -e "${YELLOW}SonarCloud Quality Gate:${NC}"

    RESPONSE=$(curl -s -H "Authorization: Bearer $SONARCLOUD_TOKEN" \
        "$SONARCLOUD_URL/api/qualitygates/project_status?projectKey=$SONARCLOUD_PROJECT_KEY&pullRequest=$PR_NUMBER")

    STATUS=$(echo "$RESPONSE" | jq -r '.projectStatus.status // "NONE"')

    case $STATUS in
        "OK")
            echo -e "${GREEN}✓ PASSED${NC}"
            ;;
        "ERROR")
            echo -e "${RED}✗ FAILED${NC}"
            echo ""
            echo "Failed conditions:"
            echo "$RESPONSE" | jq -r '.projectStatus.conditions[] | select(.status == "ERROR") | "  • \(.metricKey): \(.actualValue) (threshold: \(.errorThreshold))"'
            ;;
        "NONE")
            echo -e "${YELLOW}⚠ No analysis found${NC}"
            ;;
        *)
            echo -e "${YELLOW}⚠ Status: $STATUS${NC}"
            ;;
    esac

    # Get issue count
    ISSUES_RESPONSE=$(curl -s -H "Authorization: Bearer $SONARCLOUD_TOKEN" \
        "$SONARCLOUD_URL/api/issues/search?componentKeys=$SONARCLOUD_PROJECT_KEY&pullRequest=$PR_NUMBER&resolved=false")

    ISSUE_COUNT=$(echo "$ISSUES_RESPONSE" | jq -r '.total // 0')
    echo ""
    echo "Open issues: $ISSUE_COUNT"

    if [ "$ISSUE_COUNT" -gt 0 ]; then
        echo ""
        echo "Top issues:"
        echo "$ISSUES_RESPONSE" | jq -r '.issues[0:5][] | "  [\(.severity)] \(.message)"'

        if [ "$ISSUE_COUNT" -gt 5 ]; then
            echo "  ... and $((ISSUE_COUNT - 5)) more"
        fi
    fi

    echo ""
    echo -e "${BLUE}View details: $SONARCLOUD_URL/dashboard?id=$SONARCLOUD_PROJECT_KEY&pullRequest=$PR_NUMBER${NC}"
else
    echo -e "${YELLOW}⚠ SONARCLOUD_TOKEN not set. Skipping SonarCloud check.${NC}"
    echo "Set it with: export SONARCLOUD_TOKEN='your-token'"
fi

echo ""

# Exit code based on status
if [ "$FAILED" -gt 0 ]; then
    exit 1
elif [ "$PENDING" -gt 0 ]; then
    exit 2
else
    exit 0
fi
