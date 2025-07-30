#!/bin/bash

# Claude Code to GitHub PR Auto-Creator
# Automatically detects new workflows and triggers GitHub PR creation

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECTS_DIR="$PROJECT_ROOT/projects"
WORKFLOWS_DIR="$PROJECT_ROOT/workflows"
SYNC_MARKER="$PROJECT_ROOT/.last_sync"
FINAL_PHASE_DIR="phase-12-final"
N8N_WEBHOOK_URL="${N8N_WEBHOOK_URL:-http://localhost:5678/webhook/claude-code-pr}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Claude Code to GitHub PR Auto-Creator${NC}"
echo "================================================"

# Check if sync marker exists, if not create it
if [ ! -f "$SYNC_MARKER" ]; then
    echo -e "${YELLOW}⚠️  First run detected. Creating sync marker...${NC}"
    touch "$SYNC_MARKER"
fi

# Find workflow files newer than last sync in Projects/*/phase-12-final/
echo -e "${BLUE}🔍 Searching for new final workflow files in Projects...${NC}"
NEW_WORKFLOWS=$(find "$PROJECTS_DIR" -path "*/$FINAL_PHASE_DIR/*.json" -newer "$SYNC_MARKER" -type f 2>/dev/null || true)

if [ -z "$NEW_WORKFLOWS" ]; then
    echo -e "${GREEN}✅ No new final workflows found since last sync.${NC}"
    exit 0
fi

echo -e "${GREEN}📋 Found new final workflows:${NC}"
echo "$NEW_WORKFLOWS" | while read -r workflow; do
    PROJECT_NAME=$(echo "$workflow" | cut -d'/' -f7)
    echo "  • Project: $PROJECT_NAME → $(basename "$workflow")"
done

# Count workflows
WORKFLOW_COUNT=$(echo "$NEW_WORKFLOWS" | wc -l | tr -d ' ')
echo -e "${BLUE}📊 Total: $WORKFLOW_COUNT workflow(s)${NC}"

# Validate JSON files
echo -e "${BLUE}🔍 Validating JSON syntax...${NC}"
VALIDATION_FAILED=0

echo "$NEW_WORKFLOWS" | while read -r workflow; do
    if ! jq empty "$workflow" 2>/dev/null; then
        echo -e "${RED}❌ Invalid JSON: $(basename "$workflow")${NC}"
        VALIDATION_FAILED=1
    else
        echo -e "${GREEN}✅ Valid JSON: $(basename "$workflow")${NC}"
    fi
done

if [ $VALIDATION_FAILED -eq 1 ]; then
    echo -e "${RED}❌ JSON validation failed. Please fix syntax errors before proceeding.${NC}"
    exit 1
fi

# Check n8n webhook availability
echo -e "${BLUE}🔗 Checking n8n webhook availability...${NC}"
if command -v curl >/dev/null 2>&1; then
    if curl -s --max-time 5 "$N8N_WEBHOOK_URL" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ n8n webhook is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  n8n webhook not accessible. Manual trigger required.${NC}"
        echo -e "${YELLOW}   Make sure n8n is running and webhook is configured at: $N8N_WEBHOOK_URL${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl not available. Skipping webhook check.${NC}"
fi

# Trigger automation
echo -e "${BLUE}🚀 Triggering GitHub PR automation...${NC}"

# Method 1: Try webhook trigger
if command -v curl >/dev/null 2>&1; then
    WEBHOOK_RESPONSE=$(curl -s -X POST "$N8N_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"trigger\": \"claude-code-auto-pr\",
            \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
            \"workflows\": $(echo "$NEW_WORKFLOWS" | jq -R -s -c 'split("\n")[:-1]'),
            \"count\": $WORKFLOW_COUNT
        }" 2>/dev/null || echo "webhook_failed")
    
    if [ "$WEBHOOK_RESPONSE" != "webhook_failed" ] && [ -n "$WEBHOOK_RESPONSE" ]; then
        echo -e "${GREEN}✅ n8n webhook triggered successfully${NC}"
        echo -e "${BLUE}📊 Response: $WEBHOOK_RESPONSE${NC}"
    else
        echo -e "${YELLOW}⚠️  Webhook trigger failed. Using alternative method...${NC}"
        
        # Method 2: Manual n8n API call (if configured)
        if [ -n "${N8N_API_URL}" ] && [ -n "${N8N_API_KEY}" ]; then
            echo -e "${BLUE}🔄 Trying n8n API execution...${NC}"
            # This would require the workflow ID - placeholder for now
            echo -e "${YELLOW}⚠️  Manual execution required via n8n interface${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  No HTTP client available. Manual trigger required.${NC}"
fi

# Update sync marker
echo -e "${BLUE}📝 Updating sync marker...${NC}"
touch "$SYNC_MARKER"

# Summary
echo "================================================"
echo -e "${GREEN}🎉 Auto-PR creation process completed!${NC}"
echo -e "${BLUE}📋 Summary:${NC}"
echo "  • Processed: $WORKFLOW_COUNT workflow(s)"
echo "  • Sync marker updated: $(date)"
echo "  • Next check will detect files newer than: $(date)"

# Instructions
echo ""
echo -e "${BLUE}📖 Next Steps:${NC}"
echo "1. Check your GitHub repository for new pull requests"
echo "2. Review and merge PRs when ready"
echo "3. Existing sync workflow will deploy to n8n automatically"
echo ""
echo -e "${YELLOW}💡 Tip: Run this script periodically or set up a cron job for automation${NC}"
echo -e "${YELLOW}   Example: */10 * * * * $SCRIPT_DIR/auto-pr-creator.sh${NC}"

exit 0
