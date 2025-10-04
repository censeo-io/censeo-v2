# CI/SonarCloud Automation Scripts

Scripts to automate the PR workflow: GitHub Actions monitoring, SonarCloud quality gate checking, and issue resolution.

## Setup

### 1. Install Dependencies

Ensure you have these tools installed:
- `gh` (GitHub CLI) - https://cli.github.com/
- `jq` (JSON processor) - `brew install jq`
- `curl`

### 2. Get SonarCloud API Token

1. Visit: https://sonarcloud.io/account/security/
2. Click "Generate Tokens"
3. Name: `CLI Automation`
4. Expiration: Your choice (or no expiration)
5. Click "Generate"
6. **Copy the token immediately!**

### 3. Configure Token

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
export SONARCLOUD_TOKEN="your-token-here"
```

Then reload your shell:
```bash
source ~/.zshrc  # or ~/.bashrc
```

### 4. Verify Setup

```bash
# Check GitHub CLI
gh auth status

# Check jq
jq --version

# Check SonarCloud token
echo $SONARCLOUD_TOKEN
```

## Scripts

### 1. `check-pr-status.sh` - Quick Status Check

**Purpose:** Get a snapshot of PR status (GitHub Actions + SonarCloud)

**Usage:**
```bash
.github/scripts/check-pr-status.sh <pr-number>
```

**Example:**
```bash
.github/scripts/check-pr-status.sh 7
```

**Output:**
- List of all GitHub Action checks with status
- SonarCloud quality gate status
- Count of open issues
- Top 5 issues (if any)
- Links to detailed views

**Exit Codes:**
- `0` - All checks passed
- `1` - One or more checks failed
- `2` - Checks still pending

---

### 2. `ci-workflow-automation.sh` - Full Automation

**Purpose:** Continuously monitor PR, wait for CI, check SonarCloud, and guide through fixes

**Usage:**
```bash
.github/scripts/ci-workflow-automation.sh <pr-number>
```

**Example:**
```bash
.github/scripts/ci-workflow-automation.sh 7
```

**What it does:**
1. **Wait for GitHub Actions** - Polls every 60s until all checks complete
2. **Check GitHub Actions** - Verifies all passed
   - If failed: Downloads logs to `ci-failure-<run-id>.log` and exits
3. **Check SonarCloud** - Verifies quality gate passed
   - If failed: Downloads issues to `sonarcloud-issues-pr<N>.txt`
4. **Repeat** - Continues monitoring for up to 5 iterations

**Configuration:**
Edit the script to change:
- `MAX_ITERATIONS=5` - Number of fix cycles
- `WAIT_TIME=60` - Seconds between checks

---

## Workflow Examples

### Scenario 1: Quick Check

```bash
# Check current status
.github/scripts/check-pr-status.sh 7

# If issues found, fix them and check again
git add .
git commit -m "fix: address code review issues"
git push

# Check again
.github/scripts/check-pr-status.sh 7
```

### Scenario 2: Automated Monitoring

```bash
# Start automation (will wait for CI and check SonarCloud)
.github/scripts/ci-workflow-automation.sh 7

# Script will:
# - Wait for CI to complete
# - Check for failures
# - Check SonarCloud quality gate
# - Download issue details if needed
# - Wait for you to fix and commit
# - Repeat up to 5 times
```

### Scenario 3: Manual Debugging

```bash
# Get full status
.github/scripts/check-pr-status.sh 7

# Get failed logs manually
gh pr checks 7 | grep fail

# Get specific run logs
gh run view <run-id> --log-failed

# View SonarCloud issues in browser
# (URL provided in script output)
```

## SonarCloud API Reference

### Useful Endpoints

1. **Quality Gate Status:**
   ```bash
   curl -u "$SONARCLOUD_TOKEN:" \
     "https://sonarcloud.io/api/qualitygates/project_status?projectKey=censeo-io_censeo-v2&pullRequest=7"
   ```

2. **Search Issues:**
   ```bash
   curl -u "$SONARCLOUD_TOKEN:" \
     "https://sonarcloud.io/api/issues/search?componentKeys=censeo-io_censeo-v2&pullRequest=7&resolved=false"
   ```

3. **Get Measures:**
   ```bash
   curl -u "$SONARCLOUD_TOKEN:" \
     "https://sonarcloud.io/api/measures/component?component=censeo-io_censeo-v2&pullRequest=7&metricKeys=bugs,vulnerabilities,code_smells"
   ```

### Response Examples

**Quality Gate - Passed:**
```json
{
  "projectStatus": {
    "status": "OK",
    "conditions": [...]
  }
}
```

**Quality Gate - Failed:**
```json
{
  "projectStatus": {
    "status": "ERROR",
    "conditions": [
      {
        "status": "ERROR",
        "metricKey": "new_coverage",
        "actualValue": "75.5",
        "errorThreshold": "80"
      }
    ]
  }
}
```

## Tips

### Secure Token Storage

**Option 1: Environment variable (recommended for local dev)**
```bash
# ~/.zshrc or ~/.bashrc
export SONARCLOUD_TOKEN="your-token"
```

**Option 2: Encrypted file**
```bash
# Store encrypted
echo "your-token" | gpg -c > ~/.sonarcloud-token.gpg

# Use in script
export SONARCLOUD_TOKEN=$(gpg -d ~/.sonarcloud-token.gpg)
```

**Option 3: macOS Keychain**
```bash
# Store
security add-generic-password -a ${USER} -s sonarcloud-token -w

# Retrieve
export SONARCLOUD_TOKEN=$(security find-generic-password -a ${USER} -s sonarcloud-token -w)
```

### Common Issues

**1. "SONARCLOUD_TOKEN not set"**
- Solution: Export the token in your shell
- Verify: `echo $SONARCLOUD_TOKEN`

**2. "No analysis found"**
- Solution: Wait for SonarCloud analysis to complete (usually 2-3 minutes after CI)

**3. Authentication fails**
- Solution: Regenerate token, check it's not expired
- Note: Tokens expire after 60 days of inactivity

**4. jq command not found**
- Solution: Install jq with `brew install jq`

## Integration with Claude Code

You can ask Claude to run these scripts and interpret results:

```
Claude, please run the PR status check for PR #7 and let me know if there are any issues to fix.
```

Claude can:
- Run the scripts
- Parse the output
- Identify issues
- Suggest fixes
- Help commit and push changes
- Verify fixes

## Future Enhancements

Potential improvements:
- [ ] Add support for specific issue types filtering
- [ ] Auto-fix common SonarCloud issues
- [ ] Slack/Discord notifications
- [ ] Generate fix suggestions using AI
- [ ] Integration with IDE
- [ ] Custom quality gate thresholds
- [ ] Historical trend analysis

## Documentation

- SonarCloud API: https://sonarcloud.io/web_api
- GitHub CLI: https://cli.github.com/manual/
- jq Manual: https://stedolan.github.io/jq/manual/
