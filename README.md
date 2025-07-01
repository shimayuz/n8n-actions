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
├── samples/        # Example workflows (reference only)
├── *.json          # Your actual workflow files go here
docs/               # Documentation
scripts/            # Utility scripts
github-sync-workflow.json  # The sync workflow to import into n8n
```

### Directory Usage Guide

- **`workflows/`** - Main directory for all your production workflows
- **`workflows/samples/`** - Example workflows for reference (not synced to production)
- **`docs/`** - Setup guides and documentation
- **`scripts/`** - Utility scripts for workflow validation

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

## 📂 Actual Workflow File Placement

### Where to Put Your Workflows

**Production workflows go directly in `workflows/` directory:**

```
workflows/
├── customer-onboarding.json       # ✓ Correct placement
├── daily-backup-automation.json   # ✓ Correct placement
├── slack-notifications.json       # ✓ Correct placement
├── samples/                       # ❌ NOT for production workflows
│   ├── sample-webhook.json        # Reference only
│   └── sample-data-processing.json # Reference only
```

### Organizing Workflows (Optional)

You can create subdirectories for better organization:

```
workflows/
├── integrations/
│   ├── slack-error-notify.json
│   ├── teams-daily-report.json
│   └── discord-webhook.json
├── data-processing/
│   ├── csv-to-database.json
│   ├── api-data-sync.json
│   └── etl-pipeline.json
├── automation/
│   ├── backup-automation.json
│   ├── cleanup-old-files.json
│   └── scheduled-reports.json
└── samples/                       # Keep samples separate
    └── ...
```

**Note:** The GitHub sync workflow will process ALL `.json` files in the `workflows/` directory and its subdirectories.

## 📝 Workflow Management

### Adding a New Workflow

1. **Export from n8n:**
   - In n8n, go to your workflow
   - Click the options menu (⋮) → Download
   - Save the JSON file

2. **Add to repository:**
   ```bash
   # Copy to workflows directory (NOT samples!)
   cp ~/Downloads/my-new-workflow.json workflows/
   
   # Or if organizing by category
   cp ~/Downloads/slack-integration.json workflows/integrations/
   ```

3. **Commit and push:**
   ```bash
   git add workflows/my-new-workflow.json
   git commit -m "feat: add new customer onboarding workflow"
   git push origin feature/new-workflow
   ```

4. **Create PR and merge**
   - Create a pull request
   - After merge, the workflow will automatically be created in n8n

### Updating an Existing Workflow

1. **Export updated version from n8n:**
   - Make changes in n8n
   - Download the updated workflow

2. **Replace the file:**
   ```bash
   # Replace existing file (keep the same filename!)
   cp ~/Downloads/my-updated-workflow.json workflows/my-existing-workflow.json
   ```

3. **Commit and push:**
   ```bash
   git add workflows/my-existing-workflow.json
   git commit -m "fix: update error handling in customer workflow"
   git push origin fix/update-workflow
   ```

4. **Create PR and merge**
   - The workflow will be updated in n8n after merge
   - The workflow ID in the JSON ensures it updates the correct workflow

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

## 🔄 Complete Workflow Example

### Initial Setup
```bash
# 1. Clone the repository
git clone https://github.com/shimayuz/n8n-workflows.git
cd n8n-workflows

# 2. Import github-sync-workflow.json into n8n
# 3. Configure webhooks and credentials
```

### Daily Operations
```bash
# Create new feature branch
git checkout -b feature/add-salesforce-sync

# Add new workflow
cp ~/Downloads/salesforce-sync.json workflows/integrations/

# Validate the workflow
node scripts/validate-workflow.js workflows/integrations/salesforce-sync.json

# Commit and push
git add workflows/integrations/salesforce-sync.json
git commit -m "feat: add Salesforce data sync workflow"
git push origin feature/add-salesforce-sync

# Create PR → Review → Merge → Auto-sync to n8n ✓
```

## ⚠️ Important Notes

- **Workflow IDs**: The sync process preserves workflow IDs
- **Active Status**: Workflows maintain their active/inactive state
- **Credentials**: Credentials are NOT synced (configure manually in n8n)
- **Backup**: Always backup critical workflows before major changes
- **File Placement**: Put actual workflows in `workflows/`, NOT in `samples/`
- **File Names**: Don't change filenames of existing workflows (breaks the update link)
- **Validation**: Always validate JSON before committing

## 📚 Resources

- [n8n Documentation](https://docs.n8n.io)
- [n8n API Reference](https://docs.n8n.io/api/)
- [GitHub Webhooks Guide](https://docs.github.com/en/developers/webhooks-and-events/webhooks)