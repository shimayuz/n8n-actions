# GitHub Webhook Configuration

## Setting Up the Webhook

1. Navigate to your GitHub repository
2. Go to **Settings** → **Webhooks**
3. Click **Add webhook**

## Webhook Configuration

### Payload URL
```
https://your-n8n-instance.com/webhook/[webhook-id]
```
*Get this URL from the GitHub Trigger node in your workflow*

### Content Type
Select: `application/json`

### Secret
Leave empty (optional, can be configured if needed)

### SSL Verification
Enable SSL verification (recommended for production)

### Which events trigger this webhook?
Select: **Let me select individual events**

Then check:
- ✓ Pull requests

### Active
✓ Check this box

## Testing the Webhook

1. Click **Update webhook** to save
2. Go to **Recent Deliveries** tab
3. Create a test PR and merge it
4. Check if delivery was successful

## Webhook Payload

The webhook sends data when:
- PR is opened
- PR is closed
- PR is merged (action: "closed" with merged: true)

## Security Considerations

1. **Use HTTPS**: Always use HTTPS for webhook URLs
2. **IP Whitelisting**: Consider whitelisting GitHub's IP ranges
3. **Secret Token**: For production, implement webhook signature verification

## GitHub IP Ranges

If you need to whitelist IPs, GitHub's webhook IPs can be found at:
```
https://api.github.com/meta
```

Look for the `hooks` array in the response.