# Quick Start Documentation

Get up and running with n8n Actions quickly.

## 📚 Guides

### Getting Started
- **[Quick Start Guide](quickstart.md)** | [日本語版](quickstart-jp.md)
  - 5-minute setup
  - Generate your first workflow
  - Basic examples

- **[Setup Guide](setup-guide.md)** | [日本語版](setup-guide-jp.md)
  - Complete installation process
  - Configuration details
  - Troubleshooting

## 🚀 Quick Links

### Essential Steps
1. [Fork the Repository](#1-fork-repository)
2. [Configure API Keys](#2-configure-api-keys)
3. [Generate First Workflow](#3-generate-workflow)
4. [Deploy to n8n](#4-deploy-to-n8n)

## 📋 Checklist

### Initial Setup
- [ ] GitHub account created
- [ ] Repository forked
- [ ] Anthropic API key obtained
- [ ] GitHub Secrets configured
- [ ] First workflow generated

### Advanced Setup
- [ ] n8n instance running
- [ ] Webhooks configured
- [ ] GitHub Actions enabled
- [ ] Deployment pipeline ready

## 🎯 Choose Your Path

### I want to...

#### Just try it out
→ Follow the [Quick Start Guide](quickstart.md) (5 minutes)

#### Set up for production
→ Follow the [Complete Setup Guide](setup-guide.md) (30 minutes)

#### See what's possible
→ Check out [Examples](../references/examples.md)

## 💡 Quick Examples

### Simplest Workflow
```markdown
### Workflow Name
hello-world

### Description
Return "Hello World" via webhook

### Trigger
Webhook
```

### Practical Workflow
```markdown
### Workflow Name
slack-notifier

### Description
Send daily reports to Slack

### Trigger
Schedule (9 AM daily)

### Integrations
Slack
```

## 🛠️ Prerequisites

### Minimum Requirements
- GitHub account
- Anthropic API key ($5 free credit available)

### Full Setup Requirements
- n8n instance (self-hosted or cloud)
- GitHub personal access token
- Basic understanding of webhooks

## 📊 Time Estimates

| Task | Time |
|------|------|
| Basic setup | 5 minutes |
| First workflow | 2 minutes |
| Full configuration | 30 minutes |
| Production setup | 1-2 hours |

## 🆘 Common Issues

### Quick Fixes
| Issue | Solution |
|-------|----------|
| Actions not running | Enable in repository settings |
| API key error | Check GitHub Secrets |
| Workflow not generated | Verify issue format |

For detailed troubleshooting, see the [Setup Guide](setup-guide.md#troubleshooting).

## 📚 Next Steps

After quick start:
1. Review [n8n Actions Overview](../n8n-workflows/n8n-actions.md)
2. Explore [Workflow Examples](../references/examples.md)
3. Learn about [GitHub Integration](../n8n-workflows/github-integration.md)

## 🔗 Resources

### Documentation
- [Complete Documentation](../README.md)
- [FAQ](../references/faq.md)

### External Links
- [n8n Documentation](https://docs.n8n.io)
- [Anthropic Console](https://console.anthropic.com)
- [GitHub Actions Docs](https://docs.github.com/actions)

---

*Start building automated workflows in minutes!*