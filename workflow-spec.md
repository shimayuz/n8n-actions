# n8n Workflow 正確な仕様書 v2024.12

## 重要: このドキュメントはn8nワークフロー生成時に必ず参照すること

### 実在するノードのホワイトリスト（これ以外は使用禁止）

#### ✅ トリガーノード（必ず1つ必要）
```javascript
const TRIGGER_NODES = [
  'n8n-nodes-base.webhook',          // v1.1
  'n8n-nodes-base.scheduleTrigger',  // v1.1
  'n8n-nodes-base.manualTrigger',    // v1
  'n8n-nodes-base.emailReadImapV2'   // v2
];
```

#### ✅ コアノード（データ処理）
```javascript
const CORE_NODES = [
  'n8n-nodes-base.set',              // v3.3 - データ設定
  'n8n-nodes-base.code',             // v2 - JavaScript実行
  'n8n-nodes-base.httpRequest',      // v4.1 - API呼び出し
  'n8n-nodes-base.if',               // v2 - 条件分岐
  'n8n-nodes-base.switch',           // v3 - 複数条件
  'n8n-nodes-base.merge',            // v3 - データ結合
  'n8n-nodes-base.splitInBatches',   // v3 - バッチ処理
  'n8n-nodes-base.noOp',             // v1 - 何もしない
  'n8n-nodes-base.wait'              // v1 - 待機
];
```

#### ✅ AI/LLMノード（langchainパッケージ）
```javascript
const AI_NODES = [
  '@n8n/n8n-nodes-langchain.agent',              // v1
  '@n8n/n8n-nodes-langchain.lmChatOpenAi',       // v1
  '@n8n/n8n-nodes-langchain.toolCode',           // v1
  '@n8n/n8n-nodes-langchain.memoryBufferWindow'  // v1
];
```

#### ✅ 統合ノード（外部サービス）
```javascript
const INTEGRATION_NODES = [
  'n8n-nodes-base.slack',            // v2.1
  'n8n-nodes-base.discord',          // v2
  'n8n-nodes-base.postgres',         // v2.4
  'n8n-nodes-base.googleSheets',     // v4
  'n8n-nodes-base.gmail',            // v2
  'n8n-nodes-base.sendEmail'         // v2.1
];
```

### 動作確認済みワークフローパターン

#### パターン1: Webhook → Process → Response
```json
{
  "name": "webhook-process-example",
  "nodes": [
    {
      "id": "webhook_1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook-endpoint",
        "responseMode": "onReceived"
      }
    },
    {
      "id": "set_1",
      "name": "Set",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.3,
      "position": [450, 300],
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "1",
              "name": "message",
              "value": "Hello World",
              "type": "string"
            }
          ]
        }
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Set", "type": "main", "index": 0}]]
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

#### パターン2: Schedule → Fetch → Process → Notify
```json
{
  "name": "schedule-fetch-notify",
  "nodes": [
    {
      "id": "schedule_1",
      "name": "Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [{"field": "hours", "triggerAtHour": 9}]
        }
      }
    },
    {
      "id": "http_1", 
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [450, 300],
      "parameters": {
        "method": "GET",
        "url": "https://api.example.com/data"
      }
    },
    {
      "id": "slack_1",
      "name": "Slack",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2.1,
      "position": [650, 300],
      "parameters": {
        "operation": "post",
        "channel": "#general",
        "text": "Daily update completed"
      }
    }
  ],
  "connections": {
    "Schedule": {
      "main": [[{"node": "HTTP Request", "type": "main", "index": 0}]]
    },
    "HTTP Request": {
      "main": [[{"node": "Slack", "type": "main", "index": 0}]]
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

#### パターン3: AI Agent構成（正しい方法）
```json
{
  "name": "ai-agent-example",
  "nodes": [
    {
      "id": "webhook_1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "chat"
      }
    },
    {
      "id": "agent_1",
      "name": "Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "prompt": "You are a helpful assistant. Answer the user query: {{ $json.query }}"
      }
    },
    {
      "id": "openai_1",
      "name": "OpenAI Chat",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1,
      "position": [250, 500],
      "parameters": {
        "model": "gpt-5-mini"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Agent", "type": "main", "index": 0}]]
    },
    "OpenAI Chat": {
      "ai_languageModel": [[{"node": "Agent", "type": "ai_languageModel", "index": 0}]]
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

### 必須フィールド（欠けていたらエラー）

```javascript
const REQUIRED_WORKFLOW_FIELDS = {
  "name": "string",
  "nodes": "array",
  "connections": "object",
  "settings": {
    "executionOrder": "v1",
    "saveExecutionProgress": "boolean",
    "saveDataSuccessExecution": "string", // "all" or "none"
    "saveDataErrorExecution": "string"    // "all" or "none"
  }
};
```

### 絶対に生成してはいけないノード

```javascript
const FORBIDDEN_NODES = [
  'n8n-nodes-base.openai',     // 存在しない
  'n8n-nodes-base.gpt',        // 存在しない
  'n8n-nodes-base.chatgpt',    // 存在しない
  'webhook',                    // フルネームでない
  'http',                       // フルネームでない
  'code'                        // フルネームでない
];
```

### 検証ルール

1. **ノード存在チェック**: ホワイトリストにあるノードのみ使用
2. **バージョンチェック**: 指定されたtypeVersionを使用
3. **接続検証**: 参照先ノードが実在すること
4. **設定型チェック**: saveDataSuccessExecutionは文字列型
5. **トリガー必須**: 最低1つのトリガーノードが必要

### ノードパラメータの正確な設定

#### Webhook
```json
{
  "httpMethod": "POST",        // GET, POST, PUT, DELETE
  "path": "webhook-path",      // URLパス
  "responseMode": "onReceived" // onReceived, lastNode
}
```

#### Set (v3.3の新形式)
```json
{
  "assignments": {
    "assignments": [
      {
        "id": "unique-id",
        "name": "field_name",
        "value": "field_value",
        "type": "string"      // string, number, boolean, json
      }
    ]
  }
}
```

#### HTTP Request
```json
{
  "method": "GET",              // GET, POST, PUT, DELETE, PATCH
  "url": "https://api.example.com",
  "authentication": "none",     // none, predefinedCredentialType, genericCredentialType
  "sendBody": true,
  "bodyParametersJson": {}
}
```

#### If
```json
{
  "conditions": {
    "conditions": [
      {
        "leftValue": "={{ $json.field }}",
        "rightValue": "value",
        "operation": {
          "operation": "equals"  // equals, notEquals, contains, etc.
        }
      }
    ]
  }
}
```