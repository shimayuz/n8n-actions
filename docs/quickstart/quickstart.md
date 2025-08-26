# Quick Start Guide

## Get Started with n8n Actions in 5 Minutes

This guide will help you set up and generate your first n8n workflow automatically in less than 5 minutes.

## Prerequisites

- GitHub account
- Anthropic API key ([Free trial available](https://console.anthropic.com/))

## 3-Step Setup

### Step 1: Fork the Repository

1. Go to [this repository](https://github.com/your-org/n8n-actions)
2. Click the **Fork** button in the top-right corner
3. Fork to your account

### Step 2: Configure API Key

1. Open your forked repository's **Settings** tab
2. Navigate to **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following:
   - Name: `ANTHROPIC_API_KEY`
   - Secret: Your Claude API key

### Step 3: Generate Your First Workflow

1. Open the **Issues** tab
2. Click **New issue**
3. Select **n8n Workflow Request** template
4. Paste this sample:

```markdown
### Workflow Name
hello-world-workflow

### Workflow Description
A simple workflow that receives webhook and returns a message

### Trigger Type
Webhook

### Required Integrations
None (basic features only)

### Data Flow Specification
1. Receive data via webhook
2. Process the message
3. Return response

### Success Criteria
- Webhook works correctly
- Response is returned
```

5. Click **Submit new issue**

## Monitor Generation

1. Wait for a comment to appear on the issue (about 1-2 minutes)
2. Look for "✅ Workflow Successfully Generated!"
3. Click the linked Pull Request
4. Review the generated workflow

## Success!

Congratulations! Your first workflow has been automatically generated.

## Next Steps

### Build Practical Workflows

#### Example 1: Slack Notification Workflow

```markdown
### Workflow Name
slack-notification-workflow

### Workflow Description
Workflow that sends notifications to Slack under specific conditions

### Trigger Type
Schedule/Cron

### Required Integrations
- Slack (for notifications)

### Data Flow Specification
1. Trigger every morning at 9 AM
2. Fetch data
3. Send daily report to Slack
```

#### Example 2: AI Chatbot

```markdown
### Workflow Name
ai-chatbot-workflow

### Workflow Description
AI chatbot that answers questions using OpenAI

### Trigger Type
Webhook

### Required Integrations
- OpenAI (for AI responses)
- Slack or Discord (for messaging)

### Data Flow Specification
1. Receive message via webhook
2. Process with OpenAI
3. Return AI response
```

## Advanced Features

### Using Existing Workflows as Templates

1. Place a workflow file in `workflows/` directory
2. Reference it in your issue:

```markdown
### Base Workflow
Use workflows/template.workflow.json as base

### Modifications
- Add error handling
- Include retry logic
- Add logging
```

### Workflow Correction

If a generated workflow has issues:

1. Create an issue with the **Workflow Bug** template
2. Specify the workflow file and error
3. The system will automatically correct it

## Tips & Best Practices

### 1. Clear Instructions
- Be specific about data flow
- Include all required nodes
- Specify error handling needs

### 2. Use Templates
- Start with simple workflows
- Build complexity gradually
- Reuse successful patterns

### 3. Testing
- Always test in n8n before production
- Verify all connections
- Check error handling

## Common Patterns

### Data Processing Pipeline
```markdown
Webhook → Validate → Transform → Store → Notify
```

### Scheduled Reports
```markdown
Schedule → Fetch Data → Generate Report → Email
```

### AI Integration
```markdown
Input → AI Processing → Decision → Action
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Workflow not generated | Check API key configuration |
| Invalid JSON | Review error in PR comments |
| Node errors | Specify exact node versions |
| Connection issues | Check node compatibility |

## Getting Help

- Check [Documentation](../README.md)
- Review [Examples](../references/examples.md)
- Open an issue with questions

## Resources

- [n8n Documentation](https://docs.n8n.io)
- [n8n Node Reference](https://docs.n8n.io/nodes/)
- [Claude API Docs](https://docs.anthropic.com)

---

*Ready to automate? Start creating workflows now!*