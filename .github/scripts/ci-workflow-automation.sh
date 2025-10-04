#!/bin/bash
# CI/SonarCloud Workflow Automation Script
# Usage: ./ci-workflow-automation.sh <pr-number>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SONARCLOUD_URL="https://sonarcloud.io"
SONARCLOUD_PROJECT_KEY="censeo-io_censeo-v2"
MAX_ITERATIONS=5
WAIT_TIME=60  # seconds between checks

# Check required environment variables
if [ -z "$SONARCLOUD_TOKEN" ]; then
    echo -e "${RED}Error: SONARCLOUD_TOKEN environment variable not set${NC}"
    echo "Please set it with: export SONARCLOUD_TOKEN='your-token-here'"
    exit 1
fi

# Check required arguments
if [ -z "$1" ]; then
    echo -e "${RED}Error: PR number required${NC}"
    echo "Usage: $0 <pr-number>"
    exit 1
fi

PR_NUMBER=$1

# Function to print section headers
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Function to wait for GitHub Actions to complete
wait_for_github_actions() {
    print_header "Waiting for GitHub Actions to complete..."

    local max_wait=600  # 10 minutes
    local elapsed=0

    while [ $elapsed -lt $max_wait ]; do
        # Get pending/in_progress checks
        local pending=$(gh pr checks "$PR_NUMBER" 2>&1 | grep -c "pending\|in_progress" || true)

        if [ "$pending" -eq 0 ]; then
            echo -e "${GREEN}✓ All GitHub Actions completed${NC}"
            return 0
        fi

        echo -e "${YELLOW}⏳ Waiting... ($pending checks still running)${NC}"
        sleep $WAIT_TIME
        elapsed=$((elapsed + WAIT_TIME))
    done

    echo -e "${RED}✗ Timeout waiting for GitHub Actions${NC}"
    return 1
}

# Function to check GitHub Actions status
check_github_actions() {
    print_header "Checking GitHub Actions Status"

    local failed=$(gh pr checks "$PR_NUMBER" 2>&1 | grep -c "fail" || true)

    if [ "$failed" -gt 0 ]; then
        echo -e "${RED}✗ $failed check(s) failed${NC}"
        echo ""
        echo "Failed checks:"
        gh pr checks "$PR_NUMBER" | grep "fail"
        echo ""
        return 1
    else
        echo -e "${GREEN}✓ All GitHub Actions passed${NC}"
        return 0
    fi
}

# Function to get failed check logs
get_failed_logs() {
    print_header "Getting Failed Check Logs"

    # Get all failed checks
    local failed_checks=$(gh pr checks "$PR_NUMBER" 2>&1 | grep "fail" | awk '{print $NF}' || true)

    if [ -z "$failed_checks" ]; then
        echo "No failed checks found"
        return 0
    fi

    # Extract run IDs and get logs
    for url in $failed_checks; do
        local run_id=$(echo "$url" | grep -o "runs/[0-9]*" | cut -d'/' -f2)
        if [ -n "$run_id" ]; then
            echo -e "${YELLOW}Fetching logs for run $run_id...${NC}"
            gh run view "$run_id" --log-failed > "ci-failure-$run_id.log"
            echo -e "${GREEN}Saved to ci-failure-$run_id.log${NC}"
        fi
    done
}

# Function to check SonarCloud quality gate
check_sonarcloud() {
    print_header "Checking SonarCloud Quality Gate"

    local api_url="$SONARCLOUD_URL/api/qualitygates/project_status"
    local params="projectKey=$SONARCLOUD_PROJECT_KEY&pullRequest=$PR_NUMBER"

    echo "Fetching SonarCloud analysis for PR #$PR_NUMBER..."

    local response=$(curl -s -H "Authorization: Bearer $SONARCLOUD_TOKEN" "$api_url?$params")
    local status=$(echo "$response" | jq -r '.projectStatus.status // "NONE"')

    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✓ SonarCloud Quality Gate: PASSED${NC}"
        return 0
    elif [ "$status" = "ERROR" ]; then
        echo -e "${RED}✗ SonarCloud Quality Gate: FAILED${NC}"
        echo ""
        echo "Quality Gate Conditions:"
        echo "$response" | jq -r '.projectStatus.conditions[] | "  [\(.status)] \(.metricKey): \(.actualValue) (threshold: \(.errorThreshold))"'
        return 1
    elif [ "$status" = "NONE" ]; then
        echo -e "${YELLOW}⚠ No SonarCloud analysis found yet${NC}"
        return 2
    else
        echo -e "${YELLOW}⚠ SonarCloud Quality Gate: $status${NC}"
        return 2
    fi
}

# Function to get SonarCloud issues
get_sonarcloud_issues() {
    print_header "Fetching SonarCloud Issues"

    local api_url="$SONARCLOUD_URL/api/issues/search"
    local params="componentKeys=$SONARCLOUD_PROJECT_KEY&pullRequest=$PR_NUMBER&resolved=false"

    echo "Fetching issues for PR #$PR_NUMBER..."

    local response=$(curl -s -H "Authorization: Bearer $SONARCLOUD_TOKEN" "$api_url?$params")
    local total=$(echo "$response" | jq -r '.total // 0')

    if [ "$total" -eq 0 ]; then
        echo -e "${GREEN}✓ No issues found${NC}"
        return 0
    fi

    echo -e "${YELLOW}Found $total issue(s):${NC}"
    echo ""

    # Save detailed issues to file
    echo "$response" | jq -r '.issues[] | "[\(.severity)] \(.component):\(.line) - \(.message)\n  Rule: \(.rule)\n"' > "sonarcloud-issues-pr$PR_NUMBER.txt"

    # Print summary
    echo "$response" | jq -r '.issues[] | "  [\(.severity)] \(.component):\(.line) - \(.message)"' | head -20

    if [ "$total" -gt 20 ]; then
        echo ""
        echo -e "${YELLOW}... and $((total - 20)) more (see sonarcloud-issues-pr$PR_NUMBER.txt)${NC}"
    fi

    echo ""
    echo -e "${BLUE}Full details saved to: sonarcloud-issues-pr$PR_NUMBER.txt${NC}"
    echo -e "${BLUE}View in browser: $SONARCLOUD_URL/project/issues?id=$SONARCLOUD_PROJECT_KEY&pullRequest=$PR_NUMBER${NC}"

    return 1
}

# Function to verify local tests
verify_local_tests() {
    print_header "Running Local Verification"

    echo "Running frontend tests..."
    if cd frontend && npm test -- --watchAll=false --ci 2>&1 | tee ../frontend-test-results.log; then
        echo -e "${GREEN}✓ Frontend tests passed${NC}"
        cd ..
    else
        echo -e "${RED}✗ Frontend tests failed${NC}"
        cd ..
        return 1
    fi

    echo ""
    echo "Running backend tests..."
    if docker-compose exec -T backend python -m pytest -xvs 2>&1 | tee backend-test-results.log; then
        echo -e "${GREEN}✓ Backend tests passed${NC}"
    else
        echo -e "${RED}✗ Backend tests failed${NC}"
        return 1
    fi

    return 0
}

# Main workflow loop
main() {
    print_header "CI/SonarCloud Workflow Automation"
    echo "PR Number: $PR_NUMBER"
    echo "Max Iterations: $MAX_ITERATIONS"
    echo ""

    local iteration=0

    while [ $iteration -lt $MAX_ITERATIONS ]; do
        iteration=$((iteration + 1))
        print_header "Iteration $iteration of $MAX_ITERATIONS"

        # Step 1: Wait for GitHub Actions
        if ! wait_for_github_actions; then
            echo -e "${RED}Workflow aborted: GitHub Actions timeout${NC}"
            exit 1
        fi

        # Step 2: Check GitHub Actions status
        if ! check_github_actions; then
            echo -e "${YELLOW}GitHub Actions failed. Fetching logs...${NC}"
            get_failed_logs
            echo ""
            echo -e "${YELLOW}Please review the logs, fix the issues, commit, and push.${NC}"
            echo -e "${YELLOW}Then run this script again.${NC}"
            exit 1
        fi

        # Step 3: Check SonarCloud
        local sonar_result=0
        check_sonarcloud || sonar_result=$?

        if [ $sonar_result -eq 0 ]; then
            # Quality gate passed - but check for issues anyway
            echo ""
            echo -e "${YELLOW}Quality gate passed. Checking for remaining issues...${NC}"

            local has_issues=0
            get_sonarcloud_issues || has_issues=$?

            if [ $has_issues -eq 0 ]; then
                # No issues at all
                print_header "✅ SUCCESS - All checks passed!"
                echo -e "${GREEN}GitHub Actions: PASSED${NC}"
                echo -e "${GREEN}SonarCloud Quality Gate: PASSED${NC}"
                echo -e "${GREEN}SonarCloud Issues: 0${NC}"
                echo ""
                echo "PR #$PR_NUMBER is ready to merge! 🎉"
                exit 0
            else
                # Issues exist but quality gate passed
                print_header "⚠️  Quality Gate Passed BUT Issues Remain"
                echo -e "${GREEN}GitHub Actions: PASSED${NC}"
                echo -e "${GREEN}SonarCloud Quality Gate: PASSED${NC}"
                echo -e "${YELLOW}SonarCloud Issues: See above${NC}"
                echo ""
                echo -e "${YELLOW}The quality gate passed, but there are still issues to address.${NC}"
                echo -e "${YELLOW}Would you like to fix them? (They're not blocking merge)${NC}"
                echo ""
                read -p "Fix issues? (y/n): " -n 1 -r
                echo ""
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    echo "Exiting. You can merge the PR or fix issues later."
                    exit 0
                fi
                echo ""
                echo -e "${YELLOW}Please fix the issues, commit, and push. Continuing to monitor...${NC}"
                sleep $WAIT_TIME
            fi

        elif [ $sonar_result -eq 2 ]; then
            # No analysis yet or pending
            echo -e "${YELLOW}Waiting for SonarCloud analysis...${NC}"
            sleep $WAIT_TIME
            continue

        else
            # Quality gate failed
            get_sonarcloud_issues
            echo ""
            echo -e "${YELLOW}Please review and fix SonarCloud issues, then commit and push.${NC}"
            echo -e "${YELLOW}The script will continue monitoring...${NC}"

            # Wait for new commit
            sleep $WAIT_TIME
        fi
    done

    print_header "⚠️  Maximum iterations reached"
    echo -e "${YELLOW}The workflow automation has completed $MAX_ITERATIONS iterations.${NC}"
    echo -e "${YELLOW}Please review remaining issues and continue manually.${NC}"
    exit 1
}

# Run main workflow
main
