# n8n Workflows Repository

This repository contains n8n workflows that are automatically synchronized with your n8n instance using GitHub Actions.

## 🚀 Overview

This repository implements a CI/CD pipeline for n8n workflows:
- **Version Control**: All workflows are stored as JSON files in Git
- **Code Review**: Changes go through PR review process
- **Auto-sync**: Merged PRs automatically update workflows in n8n

## 📁 Repository Structure

```
workflows/           # n8n workflow JSON files
├── samples/        # Example workflows
docs/               # Documentation
scripts/            # Utility scripts
```

## 🔧 Setup Instructions

### 1. Fork this repository

Fork this repository to your GitHub account.

### 2. Configure GitHub Webhook

1. Go to Settings → Webhooks in your GitHub repository
2. Add webhook:
   - **Payload URL**: `https://your-n8n-instance.com/webhook/github-workflow`
   - **Content type**: `application/json`
   - **Events**: Select "Pull requests"
   - **Active**: ✓

### 3. Configure n8n

1. Import the GitHub sync workflow into n8n
2. Update the webhook URL in the GitHub Trigger node
3. Configure credentials:
   - GitHub API token (with `repo` and `admin:repo_hook` scopes)
   - n8n API credentials

### 4. Update Variables

In the "Define Local Variables" node:
- `github_owner`: Your GitHub username/organization
- `repo_name`: `n8n-workflows`

## 📝 Workflow Management

### Adding a New Workflow

1. Export your workflow from n8n (JSON format)
2. Create a new file in `workflows/` directory
3. Name it descriptively: `workflow-name.json`
4. Create a PR with your changes
5. After merge, it will auto-create in n8n

### Updating an Existing Workflow

1. Export the updated workflow from n8n
2. Replace the existing file in `workflows/`
3. Create a PR with your changes
4. After merge, it will auto-update in n8n

### Workflow Naming Convention

- Use kebab-case: `data-processing-workflow.json`
- Be descriptive: `slack-notification-on-error.json`
- Include category prefix if needed: `crm-hubspot-sync.json`

## 🔍 Workflow Validation

Before committing, validate your JSON:

```bash
node scripts/validate-workflow.js workflows/your-workflow.json
```

## 📋 Requirements

- n8n instance with API access enabled
- GitHub account with PAT (Personal Access Token)
- Webhook endpoint accessible from GitHub

## 🤝 Contributing

1. Create feature branch
2. Add/modify workflows
3. Test locally
4. Submit PR
5. Wait for review and merge

## ⚠️ Important Notes

- **Workflow IDs**: The sync process preserves workflow IDs
- **Active Status**: Workflows maintain their active/inactive state
- **Credentials**: Credentials are NOT synced (configure manually in n8n)
- **Backup**: Always backup critical workflows before major changes

## 📚 Resources

- [n8n Documentation](https://docs.n8n.io)
- [n8n API Reference](https://docs.n8n.io/api/)
- [GitHub Webhooks Guide](https://docs.github.com/en/developers/webhooks-and-events/webhooks)