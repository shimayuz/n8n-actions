# n8n Workflow Specification Guide

## Core Structure Requirements

### 1. Root Object Structure

Every n8n workflow MUST contain these top-level properties:

```json
{
  "name": "string",           // Required: Workflow name
  "nodes": [],               // Required: Array of node objects
  "connections": {},         // Required: Node connection mapping
  "settings": {},           // Required: Workflow settings
  "staticData": {},         // Optional: Static workflow data
  "meta": {},              // Optional: Metadata
  "pinData": {}            // Optional: Pinned test data
}
```

### 2. Node Object Specification

Each node MUST have:

```json
{
  "id": "uuid-v4-format",          // Unique identifier
  "name": "Human Readable Name",    // Display name
  "type": "node.type.identifier",   // n8n node type
  "typeVersion": 1,                  // Node version number
  "position": [x, y],               // Canvas position
  "parameters": {},                 // Node-specific config
  "credentials": {},                // Optional: Credentials
  "disabled": false,                // Optional: Enable/disable
  "continueOnFail": false          // Optional: Error handling
}
```

### 3. Connection Specification

Connections define data flow between nodes:

```json
{
  "connections": {
    "Node Name": {
      "main": [
        [
          {
            "node": "Target Node Name",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### 4. Settings Object (CRITICAL)

**⚠️ IMPORTANT**: String types for save options!

```json
{
  "settings": {
    "executionOrder": "v1",
    "saveExecutionProgress": true,        // Boolean
    "saveDataSuccessExecution": "all",    // STRING! Not boolean
    "saveDataErrorExecution": "all",      // STRING! Not boolean
    "executionTimeout": 3600,             // Optional: Seconds
    "timezone": "America/New_York",       // Optional: TZ
    "errorWorkflow": "",                  // Optional: Error handler
    "callerPolicy": "workflowsFromSameOwner"
  }
}
```

## Common Node Types

### Triggers

```javascript
// Webhook Trigger
"n8n-nodes-base.webhook"

// Schedule Trigger
"n8n-nodes-base.scheduleTrigger"

// Email Trigger
"n8n-nodes-base.emailReadImapV2"

// Database Trigger
"n8n-nodes-base.postgresTrigger"
```

### AI/LLM Nodes

```javascript
// OpenAI Chat
"@n8n/n8n-nodes-langchain.lmChatOpenAi"

// AI Agent
"@n8n/n8n-nodes-langchain.agent"

// Vector Store
"@n8n/n8n-nodes-langchain.vectorStoreSupabase"

// Memory Manager
"@n8n/n8n-nodes-langchain.memoryBufferWindow"
```

### Integration Nodes

```javascript
// Discord
"n8n-nodes-base.discord"

// Slack
"n8n-nodes-base.slack"

// Google Sheets
"n8n-nodes-base.googleSheets"

// HTTP Request
"n8n-nodes-base.httpRequest"
```

### Logic Nodes

```javascript
// Code Node
"n8n-nodes-base.code"

// IF Node
"n8n-nodes-base.if"

// Switch Node
"n8n-nodes-base.switch"

// Loop Over Items
"n8n-nodes-base.splitInBatches"
```

## Node Parameter Patterns

### Webhook Configuration

```json
{
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "webhook-endpoint",
    "responseMode": "onReceived",
    "responseData": "allEntries",
    "options": {
      "rawBody": true,
      "ignoreBots": false
    }
  }
}
```

### AI Agent Configuration

```json
{
  "type": "@n8n/n8n-nodes-langchain.agent",
  "parameters": {
    "prompt": "You are a helpful assistant...",
    "text": "={{ $json.message }}",
    "systemMessage": "Always be helpful and accurate",
    "maxIterations": 10,
    "returnIntermediateSteps": true,
    "options": {
      "temperature": 0.7,
      "maxTokens": 2000
    }
  }
}
```

### Code Node Configuration

```json
{
  "type": "n8n-nodes-base.code",
  "parameters": {
    "mode": "runOnceForEachItem",
    "language": "javaScript",
    "jsCode": "// Your code here\nreturn items;"
  }
}
```

## Validation Rules

### 1. ID Uniqueness
- Every node ID must be globally unique within the workflow
- Prefer UUID v4 format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

### 2. Connection Integrity
- All referenced nodes in connections must exist
- Connection indices must be valid (0-based)
- No circular dependencies that would cause infinite loops

### 3. Type Version Compatibility
- Use the latest stable typeVersion for each node
- Check n8n documentation for deprecated versions

### 4. Credential References
- Credential names must match configured credentials in n8n
- Use credential IDs, not display names

### 5. Expression Syntax
- n8n expressions: `={{ expression }}`
- Valid JavaScript within expressions
- Proper escaping of special characters

## Best Practices

### 1. Error Handling
```json
{
  "continueOnFail": true,
  "onError": "continueErrorOutput"
}
```

### 2. Performance Optimization
- Use batch processing for large datasets
- Implement rate limiting for API calls
- Cache frequently accessed data

### 3. Security
- Never hardcode credentials
- Use environment variables for sensitive data
- Implement input validation

### 4. Naming Conventions
- Nodes: `PascalCase` (e.g., "ProcessUserData")
- Variables: `camelCase` (e.g., "userId")
- Workflows: `kebab-case` (e.g., "user-onboarding-flow")

## Common Pitfalls to Avoid

1. **Boolean vs String Settings**: Always use strings for `saveDataSuccessExecution` and `saveDataErrorExecution`
2. **Missing Connections**: Ensure all nodes are properly connected
3. **Invalid Expressions**: Test all dynamic expressions
4. **Credential Mismatches**: Verify credential names
5. **Position Overlaps**: Ensure nodes don't overlap on canvas

## Workflow Templates

### Basic Webhook → Process → Response

```json
{
  "name": "webhook-processor",
  "nodes": [
    {
      "id": "webhook-trigger",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "process"
      },
      "typeVersion": 1.1
    },
    {
      "id": "process-data",
      "name": "Process",
      "type": "n8n-nodes-base.code",
      "position": [450, 300],
      "parameters": {
        "jsCode": "return items;"
      },
      "typeVersion": 2
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Process", "type": "main", "index": 0}]]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "saveExecutionProgress": true,
    "saveDataSuccessExecution": "all",
    "saveDataErrorExecution": "all"
  }
}
```

## Validation Checklist

- [ ] Valid JSON syntax
- [ ] All required root properties present
- [ ] All nodes have unique IDs
- [ ] All connections reference existing nodes
- [ ] Settings use correct data types
- [ ] No circular dependencies
- [ ] Expressions are valid
- [ ] Credentials are referenced correctly
- [ ] Node positions don't overlap
- [ ] TypeVersions are current