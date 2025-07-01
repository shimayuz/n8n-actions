# Workflows Directory

This directory contains all n8n workflow JSON files that will be synchronized with your n8n instance.

## 🎯 Quick Guide: Where to Put Your Files

### ✅ Production Workflows → Place directly in `workflows/`
```
workflows/
├── customer-onboarding.json      ← Your actual workflows go here!
├── daily-report.json             ← These will sync to n8n
├── slack-notifications.json      ← Automatically on PR merge
└── samples/                      ← NOT here!
```

### ❌ samples/ Directory → Reference only!
- The `samples/` folder contains example workflows
- These are for learning and reference purposes
- **DO NOT** place your production workflows here
- Files in `samples/` are included in the repo but not meant for production use

## 📁 Recommended Organization

You can organize workflows in subdirectories:

```
workflows/
├── integrations/
│   ├── slack-webhook.json
│   ├── discord-bot.json
│   └── teams-connector.json
├── automation/
│   ├── backup-daily.json
│   ├── cleanup-weekly.json
│   └── report-monthly.json
├── data-processing/
│   ├── csv-importer.json
│   ├── api-sync.json
│   └── database-etl.json
└── samples/                    # Keep reference examples separate
    ├── sample-webhook.json
    └── sample-data-processing.json
```

## 📝 Step-by-Step: Adding Your First Workflow

1. **Export from n8n:**
   ```
   n8n → Your Workflow → ⋮ Menu → Download
   ```

2. **Place in this directory:**
   ```bash
   # Copy to workflows directory
   cp ~/Downloads/my-workflow.json ./
   
   # Or to a subdirectory
   mkdir -p integrations
   cp ~/Downloads/slack-integration.json ./integrations/
   ```

3. **Verify placement:**
   ```bash
   ls -la workflows/
   # Should see your file here, NOT in samples/
   ```

## ⚠️ Important Reminders

1. **One workflow per file**: Each JSON file = one workflow
2. **Keep the filename**: Changing filename breaks update tracking
3. **No credentials**: Remove API keys, passwords before committing
4. **Validate first**: Use `node ../scripts/validate-workflow.js your-workflow.json`

## 🔍 File Naming Best Practices

### ✅ Good Names:
- `customer-onboarding-automation.json`
- `slack-error-notifications.json`
- `salesforce-daily-sync.json`
- `backup-database-weekly.json`

### ❌ Bad Names:
- `workflow1.json` (not descriptive)
- `test.json` (unclear purpose)
- `final-v2-updated.json` (versioning in filename)
- `MyWorkflow.json` (use kebab-case)