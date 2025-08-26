# Frequently Asked Questions (FAQ)

## Table of Contents

- [Setup Questions](#setup-questions)
- [Workflow Generation Questions](#workflow-generation-questions)
- [Error & Troubleshooting](#error--troubleshooting)
- [Advanced Usage](#advanced-usage)
- [Pricing & License](#pricing--license)

---

## Setup Questions

### Q1: Where can I get an Anthropic API key?

**A**: Follow these steps:

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account (free)
3. Navigate to "API Keys" section
4. Click "Create Key"
5. Copy and store the key securely

**About pricing**:
- Free trial: $5 credit included
- Pay-as-you-go: Charged based on usage
- Estimate: 1 workflow generation = approximately $0.02-0.05

---

### Q2: GitHub Actions is not working?

**A**: Please check the following:

1. **Are Actions enabled?**
   ```
   Settings → Actions → General → Actions permissions
   → Select "Allow all actions and reusable workflows"
   ```

2. **Are secrets configured correctly?**
   ```
   Settings → Secrets and variables → Actions
   → Verify ANTHROPIC_API_KEY exists
   ```

3. **Are there syntax errors in workflow files?**
   ```bash
   # Validate locally
   npm run validate-workflows
   ```

4. **For forked repositories**
   - Actions are disabled by default in forks
   - You need to explicitly enable them in the Actions tab

---

### Q3: Do I need an n8n instance?

**A**: No, you don't need one just for workflow generation.

- **Generation only**: n8n instance not required
- **Testing**: n8n instance required
- **Production deployment**: n8n instance required

**How to set up n8n**:

```bash
# Easy setup with Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

---

## Workflow Generation Questions

### Q4: What kinds of workflows can be generated?

**A**: The following types of workflows can be generated:

| Category | Examples |
|----------|----------|
| **Basic** | Webhook, scheduled execution, data transformation |
| **AI/ML** | ChatGPT integration, image recognition, sentiment analysis |
| **Data Processing** | ETL, batch processing, data synchronization |
| **Communication** | Slack, Discord, email, SMS |
| **Business Automation** | Invoice processing, inventory management, report generation |
| **Development** | CI/CD notifications, error monitoring, deployment automation |

See [Examples](examples.md) for details.

---

### Q5: Why does generation fail?

**A**: Common causes and solutions:

| Cause | Solution |
|-------|----------|
| **Invalid API key** | Check if ANTHROPIC_API_KEY is correct |
| **Unclear instructions** | Provide more specific workflow description |
| **Complex requirements** | Break down into simpler workflows |
| **Rate limit exceeded** | Wait and retry or upgrade API plan |
| **Invalid node specified** | Use correct n8n node names |

---

### Q6: How long does generation take?

**A**: Typically:
- Simple workflow: 30-60 seconds
- Medium complexity: 1-2 minutes
- Complex workflow: 2-3 minutes

If it takes longer than 5 minutes, check the Actions logs.

---

## Error & Troubleshooting

### Q7: "Workflow validation failed" error

**A**: This means the generated JSON has structural issues.

**Solutions**:
1. Check the error message in PR comments
2. Common issues:
   - Missing required fields
   - Invalid node connections
   - Incorrect data types

The system will attempt auto-correction up to 3 times.

---

### Q8: "API rate limit exceeded" error

**A**: You've exceeded the Anthropic API usage limit.

**Solutions**:
1. Wait for the rate limit to reset (usually 1 minute)
2. Reduce the frequency of requests
3. Upgrade your API plan if needed
4. Implement caching for repeated requests

---

### Q9: Generated workflow doesn't appear in PR

**A**: Check the following:

1. **GitHub Actions logs**
   - Go to Actions tab
   - Check the latest workflow run
   - Look for error messages

2. **Issue format**
   - Ensure you're using the correct template
   - All required fields must be filled

3. **Permissions**
   - Bot needs write access to the repository
   - Check GitHub token permissions

---

## Advanced Usage

### Q10: Can I use custom n8n nodes?

**A**: Yes, but with limitations:

- **Community nodes**: Specify the full package name
- **Custom nodes**: Provide node definition in the issue
- **Note**: AI may not know about very new or custom nodes

**Example**:
```markdown
### Custom Node Required
Package: n8n-nodes-custom-integration
Node Type: customIntegration.trigger
```

---

### Q11: How to generate complex multi-branch workflows?

**A**: Use detailed specifications:

```markdown
### Branch Logic
IF condition: status == "approved"
  THEN: Send to manager
  ELSE: Send back for revision

### Parallel Processing
Split data into 3 parallel branches:
1. Process payments
2. Update inventory
3. Send notifications
```

---

### Q12: Can I modify generated workflows?

**A**: Yes, several ways:

1. **Before generation**: Edit issue description
2. **After generation**: Edit PR files directly
3. **Using correction**: Create new issue with "Correct Workflow" template
4. **Manual editing**: Download JSON and edit in n8n

---

## Pricing & License

### Q13: Is this free to use?

**A**: The tool itself is free and open-source.

**Costs involved**:
- **Anthropic API**: Pay-as-you-go (small cost per generation)
- **GitHub Actions**: Free tier includes 2000 minutes/month
- **n8n**: Free self-hosted or paid cloud version

---

### Q14: Can I use this commercially?

**A**: Yes, under MIT License.

- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ⚠️ No warranty provided
- ⚠️ No liability accepted

---

### Q15: How many workflows can I generate?

**A**: Depends on your API limits:

| Plan | Workflows/Day (Estimate) |
|------|-------------------------|
| Free Trial | 100-200 |
| Basic | 1,000-2,000 |
| Pro | 10,000+ |

---

## Security & Privacy

### Q16: Is my data secure?

**A**: Security measures in place:

- API keys stored as GitHub Secrets
- No sensitive data logged
- Workflows processed in memory only
- HTTPS for all communications
- No data retention by the tool

---

### Q17: Can I use this with private repositories?

**A**: Yes, fully supported.

- Works with both public and private repos
- Ensure GitHub token has appropriate permissions
- Generated workflows stay within your repository

---

## Support & Community

### Q18: How to get help?

**A**: Multiple support channels:

1. **Documentation**: Check guides and examples
2. **GitHub Issues**: Open an issue for bugs
3. **Discussions**: Use GitHub Discussions for questions
4. **Community**: Join n8n community forum

---

### Q19: How to contribute?

**A**: Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
5. Follow contribution guidelines

---

### Q20: Roadmap and future features?

**A**: Planned improvements:

- 🚧 Visual workflow editor integration
- 🚧 More AI model options
- 🚧 Workflow marketplace
- 🚧 Performance optimizations
- 🚧 Enhanced error recovery
- 🚧 Multi-language support

Check [GitHub Projects](https://github.com/your-org/n8n-actions/projects) for latest updates.

---

*Have more questions? Open an issue!*