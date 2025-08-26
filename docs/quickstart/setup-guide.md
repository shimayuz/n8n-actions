# n8n Actions Setup Guide

## Prerequisites

- n8n instance (self-hosted or cloud)
- GitHub account  
- Anthropic API key
- Basic understanding of webhooks and APIs

## Complete Setup Process

### Step 1: GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with scopes:
   - `repo` (Full control of private repositories)
   - `admin:repo_hook` (Full control of repository hooks)
   - `workflow` (Update GitHub Action workflows)
3. Copy and save the token securely

### Step 2: Anthropic API Setup

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Save the key securely

### Step 3: n8n API Configuration

1. In n8n, go to Settings → API
2. Generate API key
3. Note your n8n instance URL
4. Enable API access if not already enabled

### Step 4: Repository Setup

#### Fork and Clone
```bash
# Fork the repository on GitHub first
# Then clone your fork
git clone https://github.com/YOUR-USERNAME/n8n-actions.git
cd n8n-actions
```

#### Install Dependencies
```bash
npm install
```

#### Configure Environment Variables
Create `.env` file:
```env
# API Keys
ANTHROPIC_API_KEY=your-anthropic-key
N8N_API_KEY=your-n8n-api-key
GITHUB_TOKEN=your-github-token

# URLs
N8N_BASE_URL=https://your-n8n-instance.com
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook

# Configuration
GITHUB_OWNER=your-username
GITHUB_REPO=n8n-actions
```

### Step 5: GitHub Actions Configuration

1. Navigate to your repository on GitHub
2. Go to Settings → Secrets and variables → Actions
3. Add the following secrets:

| Secret Name | Value |
|------------|--------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `N8N_API_KEY` | Your n8n API key |
| `N8N_WEBHOOK_URL` | Your n8n webhook URL |
| `N8N_BASE_URL` | Your n8n instance URL |

### Step 6: Import Core Workflows

#### GitHub Sync Workflow
1. Download `workflows/github-sync.workflow.json`
2. In n8n, click "Import from File"
3. Select the workflow file
4. Click "Import"

#### Auto-Generation Workflow
1. Download `workflows/auto-generate.workflow.json`
2. Import to n8n
3. Configure webhook path

### Step 7: Configure n8n Credentials

#### GitHub Credentials
1. In the workflow, click on any GitHub node
2. Select "Create New" credential
3. Enter:
   - Name: `GitHub`
   - Access Token: Your Personal Access Token
4. Save

#### OpenAI/Claude Credentials
1. Click on AI nodes
2. Create new credential
3. Enter:
   - Name: `Claude API`
   - API Key: Your Anthropic key
4. Save

### Step 8: Update Workflow Variables

1. Open "Define Local Variables" node
2. Update:
```javascript
{
  "github_owner": "YOUR-USERNAME",
  "github_repo": "n8n-actions",
  "n8n_instance_url": "https://your-n8n.com",
  "webhook_path": "github-sync"
}
```

### Step 9: Activate Workflows

1. Toggle each workflow to "Active"
2. Test webhook URLs
3. Verify connections

### Step 10: GitHub Webhook Setup

1. Go to repository Settings → Webhooks
2. Add webhook:
   - Payload URL: `https://your-n8n.com/webhook/github-sync`
   - Content type: `application/json`
   - Events: Select individual events:
     - Pull requests
     - Issues
     - Push
3. Save webhook

## Verification Steps

### Test Webhook Connection
```bash
curl -X POST https://your-n8n.com/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": "connection"}'
```

### Test Workflow Generation
1. Create a test issue with workflow request
2. Check if workflow is generated
3. Verify PR is created

### Test GitHub Sync
1. Make a change to a workflow
2. Push to repository
3. Verify n8n workflow updates

## Configuration Options

### Advanced Settings

#### Rate Limiting
```javascript
{
  "rateLimits": {
    "requestsPerMinute": 60,
    "requestsPerHour": 1000
  }
}
```

#### Auto-Deployment
```javascript
{
  "autoDeployment": {
    "enabled": true,
    "branches": ["main", "production"],
    "requireApproval": false
  }
}
```

#### Error Handling
```javascript
{
  "errorHandling": {
    "retryAttempts": 3,
    "notifyOnError": true,
    "slackWebhook": "https://hooks.slack.com/..."
  }
}
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Webhook not received | Check n8n workflow is active |
| API authentication fails | Verify API keys are correct |
| Workflow generation fails | Check Anthropic API quota |
| GitHub sync not working | Verify webhook configuration |

### Debug Mode

Enable debug logging:
```javascript
// In workflow Code node
console.log('Debug:', JSON.stringify($input.all(), null, 2));
```

### Health Check

Run health check script:
```bash
node scripts/health-check.js
```

## Security Best Practices

1. **API Key Management**
   - Use environment variables
   - Rotate keys regularly
   - Never commit keys to repository

2. **Webhook Security**
   - Implement signature verification
   - Use HTTPS only
   - Whitelist GitHub IPs

3. **Access Control**
   - Limit repository permissions
   - Use branch protection
   - Enable 2FA on all accounts

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and rotate API keys quarterly
- Backup workflows weekly
- Monitor error logs daily

### Updating n8n Actions
```bash
git pull upstream main
npm update
npm run test
```

## Support Resources

- [n8n Documentation](https://docs.n8n.io)
- [GitHub Actions Docs](https://docs.github.com/actions)
- [Anthropic API Reference](https://docs.anthropic.com)
- [Community Forum](https://community.n8n.io)

---

*Need help? Open an issue on GitHub*