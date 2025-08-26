# n8n Workflow Specification Guide

## Overview

This guide defines the complete JSON structure and requirements for n8n workflows compatible with n8n Actions automation system.

## Core Structure

### Basic Workflow Template

```json
{
  "name": "Workflow Name",
  "nodes": [],
  "connections": {},
  "active": false,
  "settings": {
    "executionOrder": "v1",
    "saveExecutionProgress": true,
    "saveDataSuccessExecution": "all",
    "saveDataErrorExecution": "all"
  },
  "versionId": "uuid",
  "meta": {
    "instanceId": "uuid"
  },
  "id": "unique_id",
  "tags": []
}
```

## Required Fields

### 1. Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Workflow display name |
| `nodes` | array | Yes | Array of node configurations |
| `connections` | object | Yes | Node connection definitions |
| `active` | boolean | Yes | Workflow activation status |
| `settings` | object | Yes | Execution settings |
| `id` | string | No | Unique workflow identifier |
| `tags` | array | No | Workflow categorization tags |

### 2. Settings Configuration

**CRITICAL**: `saveDataSuccessExecution` and `saveDataErrorExecution` must be strings!

```json
"settings": {
  "executionOrder": "v1",
  "saveExecutionProgress": true,          // boolean
  "saveDataSuccessExecution": "all",      // STRING - "all" or "none"
  "saveDataErrorExecution": "all",        // STRING - "all" or "none"
  "executionTimeout": 3600,               // optional, in seconds
  "timezone": "America/New_York"          // optional
}
```

## Node Specifications

### Node Structure

```json
{
  "parameters": {},
  "id": "unique-node-id",
  "name": "Node Name",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1.1,
  "position": [250, 300]
}
```

### Common Node Types

#### Trigger Nodes
```json
{
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1.1,
  "parameters": {
    "path": "webhook-path",
    "method": "POST",
    "responseMode": "onReceived"
  }
}
```

#### Core Processing Nodes
```json
{
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "parameters": {
    "language": "javaScript",
    "code": "// Your code here"
  }
}
```

#### AI/LLM Nodes
```json
{
  "type": "@n8n/n8n-nodes-langchain.agent",
  "typeVersion": 1,
  "parameters": {
    "promptType": "define"
  }
}
```

## Connection Patterns

### Basic Connection Structure

```json
"connections": {
  "SourceNodeName": {
    "main": [
      [
        {
          "node": "TargetNodeName",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```

### Multiple Output Connections

```json
"connections": {
  "IF": {
    "main": [
      [{"node": "True Branch", "type": "main", "index": 0}],
      [{"node": "False Branch", "type": "main", "index": 0}]
    ]
  }
}
```

### AI Agent Connections

```json
"connections": {
  "Agent": {
    "ai_agent": [
      [{"node": "OpenAI Chat Model", "type": "ai_languageModel", "index": 0}]
    ],
    "ai_tool": [
      [{"node": "Calculator", "type": "ai_tool", "index": 0}],
      [{"node": "Code Tool", "type": "ai_tool", "index": 0}]
    ]
  }
}
```

## Validation Rules

### 1. Structure Validation
- Valid JSON syntax
- All required fields present
- Correct data types for each field

### 2. Node Validation
- Valid node types from n8n ecosystem
- Correct version numbers
- Required parameters for each node type

### 3. Connection Validation
- All referenced nodes must exist
- Connection types must match node capabilities
- No circular dependencies

### 4. Settings Validation
- `saveDataSuccessExecution`: Must be "all" or "none" (string)
- `saveDataErrorExecution`: Must be "all" or "none" (string)
- `executionOrder`: Must be "v1" for compatibility

## Best Practices

### 1. Error Handling
```json
{
  "type": "n8n-nodes-base.errorTrigger",
  "parameters": {
    "errorMessage": "={{$json.error.message}}"
  }
}
```

### 2. Resource Optimization
- Use batch processing nodes when possible
- Implement rate limiting for API calls
- Add wait nodes between heavy operations

### 3. Data Security
- Use credential system for sensitive data
- Implement input validation
- Sanitize outputs

## Common Patterns

### 1. Webhook → Process → Response
```json
{
  "nodes": [
    {"type": "n8n-nodes-base.webhook", "name": "Webhook"},
    {"type": "n8n-nodes-base.code", "name": "Process"},
    {"type": "n8n-nodes-base.respondToWebhook", "name": "Response"}
  ]
}
```

### 2. Scheduled Data Sync
```json
{
  "nodes": [
    {"type": "n8n-nodes-base.scheduleTrigger", "name": "Schedule"},
    {"type": "n8n-nodes-base.httpRequest", "name": "Fetch Data"},
    {"type": "n8n-nodes-base.postgres", "name": "Save to DB"}
  ]
}
```

### 3. AI-Enhanced Processing
```json
{
  "nodes": [
    {"type": "n8n-nodes-base.webhook", "name": "Input"},
    {"type": "@n8n/n8n-nodes-langchain.agent", "name": "AI Agent"},
    {"type": "n8n-nodes-base.slack", "name": "Notify"}
  ]
}
```

## Testing & Validation

### Validation Script Example
```javascript
function validateWorkflow(workflow) {
  // Check required fields
  if (!workflow.name || !workflow.nodes || !workflow.connections) {
    return { valid: false, error: "Missing required fields" };
  }
  
  // Validate settings
  const { saveDataSuccessExecution, saveDataErrorExecution } = workflow.settings;
  if (typeof saveDataSuccessExecution !== 'string' || 
      typeof saveDataErrorExecution !== 'string') {
    return { valid: false, error: "Settings must be strings" };
  }
  
  return { valid: true };
}
```

## Migration Guide

### From v0.x to v1.0
1. Update node type names to full format
2. Convert settings to string values
3. Add `executionOrder: "v1"`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid workflow" | Check JSON syntax |
| "Node not found" | Verify node types and versions |
| "Connection error" | Check node names in connections |
| "Settings type error" | Ensure string values for save settings |

---

*Last updated for n8n v1.0+ compatibility*