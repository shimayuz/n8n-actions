# n8n GitHub Sync Setup Guide

## Prerequisites

- n8n instance (self-hosted or cloud)
- GitHub account
- Basic understanding of webhooks and APIs

## Step 1: GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with scopes:
   - `repo` (Full control of private repositories)
   - `admin:repo_hook` (Full control of repository hooks)
3. Copy and save the token securely

## Step 2: n8n API Credentials

1. In n8n, go to Settings → API
2. Generate API key
3. Note your n8n instance URL

## Step 3: Import Sync Workflow

1. Download the GitHub sync workflow JSON
2. In n8n, click "Import from File"
3. Select the workflow file
4. Click "Import"

## Step 4: Configure Credentials

### GitHub Credentials
1. In the workflow, click on any GitHub node
2. Select "Create New" credential
3. Enter your Personal Access Token
4. Save

### n8n API Credentials
1. Click on any n8n node in the workflow
2. Select "Create New" credential
3. Enter:
   - API Key: Your n8n API key
   - Base URL: Your n8n instance URL
4. Save

## Step 5: Update Variables

1. Open "Define Local Variables" node
2. Update:
   - `github_owner`: Your GitHub username
   - `repo_name`: Your repository name

## Step 6: Activate Workflow

1. Click the toggle to activate the workflow
2. Copy the webhook URL from the GitHub Trigger node

## Step 7: Configure GitHub Webhook

See [webhook-configuration.md](webhook-configuration.md) for detailed instructions.

## Troubleshooting

### Webhook not triggering
- Check webhook URL is correct
- Verify webhook is active in GitHub
- Check n8n workflow is active

### Authentication errors
- Regenerate and update tokens
- Check token permissions
- Verify API access is enabled

### Workflow not updating
- Check workflow JSON is valid
- Verify file path matches pattern
- Check n8n API permissions