# Workflows Directory

This directory contains all n8n workflow JSON files.

## Structure

- Place workflow JSON files directly in this directory
- Use `samples/` subdirectory for example workflows
- Each workflow should be a valid n8n JSON export

## Guidelines

1. **One workflow per file**: Each JSON file should contain exactly one workflow
2. **Descriptive names**: Use clear, descriptive filenames
3. **Valid JSON**: Ensure all files are valid JSON format
4. **No credentials**: Remove any hardcoded credentials before committing

## File Naming

- `customer-onboarding.json` ✓
- `daily-backup-automation.json` ✓
- `workflow1.json` ✗ (not descriptive)
- `test.json` ✗ (not descriptive)