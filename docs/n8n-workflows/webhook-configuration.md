# Webhook Configuration Guide

## Overview

This guide covers webhook configuration for n8n workflows, including GitHub webhooks, n8n webhook nodes, and security best practices.

## n8n Webhook Node Setup

### Basic Webhook Configuration

```json
{
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1.1,
  "parameters": {
    "path": "unique-webhook-path",
    "method": "POST",
    "responseMode": "onReceived",
    "responseData": "firstEntryJson",
    "options": {
      "responseHeaders": {
        "values": [
          {
            "name": "Content-Type",
            "value": "application/json"
          }
        ]
      }
    }
  }
}
```

### Webhook Methods

| Method | Use Case | Example |
|--------|----------|---------|
| `GET` | Data retrieval | Status checks |
| `POST` | Data submission | Form processing |
| `PUT` | Full updates | Resource replacement |
| `PATCH` | Partial updates | Field modifications |
| `DELETE` | Resource removal | Cleanup operations |

### Response Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `onReceived` | Immediate response | Quick acknowledgment |
| `lastNode` | Wait for completion | Full processing |
| `responseNode` | Custom response | Complex logic |

## GitHub Webhook Configuration

### Setting Up GitHub Webhook

1. Navigate to repository **Settings** → **Webhooks**
2. Click **Add webhook**
3. Configure webhook settings

### GitHub Webhook Settings

#### Payload URL
```
https://your-n8n-instance.com/webhook/[webhook-path]
```

#### Content Type
Select: `application/json`

#### Secret (Optional)
```
your-secret-key-here
```

#### SSL Verification
- **Production**: Enable SSL verification
- **Development**: Can be disabled (not recommended)

#### Events Selection

**For n8n Actions Automation:**
- ✓ Pull requests
- ✓ Issues
- ✓ Issue comments
- ✓ Push
- ✓ Workflow runs

### GitHub Event Payloads

#### Pull Request Event
```json
{
  "action": "opened|closed|synchronize",
  "pull_request": {
    "id": 123,
    "number": 45,
    "title": "PR Title",
    "body": "PR Description",
    "state": "open|closed",
    "merged": true|false,
    "base": {
      "ref": "main"
    },
    "head": {
      "ref": "feature-branch"
    }
  }
}
```

#### Issue Event
```json
{
  "action": "opened|edited|closed",
  "issue": {
    "number": 67,
    "title": "Issue Title",
    "body": "Issue Description",
    "labels": [
      {
        "name": "workflow-request"
      }
    ]
  }
}
```

## Webhook Security

### 1. Authentication Methods

#### HMAC Signature Verification
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${hash}` === signature;
}
```

#### API Key Authentication
```json
{
  "parameters": {
    "authentication": "headerAuth",
    "genericAuthType": "httpHeaderAuth",
    "httpHeaderAuth": {
      "name": "X-API-Key",
      "value": "={{$credentials.apiKey}}"
    }
  }
}
```

### 2. Rate Limiting

```javascript
const rateLimit = {
  window: 60000, // 1 minute
  max: 100, // max requests
  message: 'Too many requests'
};
```

### 3. IP Whitelisting

```javascript
const allowedIPs = [
  '140.82.112.0/20', // GitHub webhooks
  '143.55.64.0/20',  // GitHub webhooks
  '192.30.252.0/22', // GitHub webhooks
  '185.199.108.0/22' // GitHub Pages
];
```

## Advanced Webhook Patterns

### 1. Webhook Router

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "name": "Webhook Entry"
    },
    {
      "type": "n8n-nodes-base.switch",
      "name": "Route by Event",
      "parameters": {
        "dataType": "string",
        "value1": "={{$json.headers['x-github-event']}}",
        "rules": {
          "rules": [
            {
              "value2": "pull_request",
              "output": 0
            },
            {
              "value2": "issues",
              "output": 1
            }
          ]
        }
      }
    }
  ]
}
```

### 2. Webhook Queue

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "name": "Receive",
      "parameters": {
        "responseMode": "onReceived"
      }
    },
    {
      "type": "n8n-nodes-base.rabbitmq",
      "name": "Queue",
      "parameters": {
        "queue": "webhook-queue"
      }
    }
  ]
}
```

### 3. Webhook Retry Logic

```javascript
{
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "={{$node['Webhook'].json.callback_url}}",
    "options": {
      "retry": {
        "maxTries": 3,
        "waitBetweenTries": 5000,
        "maxRetryAfter": 60000
      }
    }
  }
}
```

## Testing Webhooks

### 1. Local Testing with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start n8n locally
n8n start

# Expose local n8n
ngrok http 5678

# Use ngrok URL for webhook
https://abc123.ngrok.io/webhook/test
```

### 2. Webhook Testing Tools

```bash
# Using curl
curl -X POST https://your-n8n.com/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Using httpie
http POST https://your-n8n.com/webhook/test \
  test=data
```

### 3. n8n Test Webhook

```javascript
// Test webhook node configuration
{
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "test",
    "options": {
      "responseCode": 200,
      "responseData": "allEntries"
    }
  }
}
```

## Monitoring & Debugging

### 1. Webhook Logs

```javascript
// Enable webhook logging
{
  "parameters": {
    "options": {
      "logReceivedData": true,
      "saveDataErrorExecution": "all",
      "saveDataSuccessExecution": "all"
    }
  }
}
```

### 2. Debug Headers

```javascript
// Log all headers
const headers = $input.item.json.headers;
console.log('Received headers:', headers);

// Check specific header
const githubEvent = headers['x-github-event'];
console.log('GitHub Event:', githubEvent);
```

### 3. Error Handling

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.errorTrigger",
      "name": "Catch Errors"
    },
    {
      "type": "n8n-nodes-base.slack",
      "name": "Alert on Error",
      "parameters": {
        "channel": "#alerts",
        "text": "Webhook error: {{$json.error.message}}"
      }
    }
  ]
}
```

## Performance Optimization

### 1. Async Processing
- Use `responseMode: "onReceived"` for immediate response
- Process data asynchronously
- Implement queue systems for heavy processing

### 2. Payload Size Limits
```javascript
{
  "options": {
    "maxPayloadSize": "10mb",
    "timeout": 30000
  }
}
```

### 3. Caching Strategies
- Cache frequently accessed data
- Implement response caching
- Use CDN for static webhook responses

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook not triggering | Incorrect path | Verify webhook URL matches |
| 404 errors | Workflow inactive | Activate workflow in n8n |
| Timeout errors | Long processing | Use async response mode |
| Authentication fails | Wrong credentials | Check secret/API key |
| Duplicate events | Multiple webhooks | Implement idempotency |

## Best Practices

1. **Use unique webhook paths** to avoid conflicts
2. **Implement authentication** for production webhooks
3. **Add rate limiting** to prevent abuse
4. **Log webhook events** for debugging
5. **Use HTTPS** for all production webhooks
6. **Implement idempotency** to handle duplicate events
7. **Set appropriate timeouts** for processing
8. **Monitor webhook health** with alerts

---

*Part of the n8n Actions automation system*