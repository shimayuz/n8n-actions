# Discord Chatbot ワークフロー詳細設計

## ノード構成

### 1. Schedule Trigger
- **Type**: nodes-base.scheduleTrigger
- **Version**: 1.2
- **Config**:
  ```json
  {
    "rule": {
      "interval": [
        {
          "field": "seconds",
          "secondsInterval": 30
        }
      ]
    }
  }
  ```
- **Position**: [250, 300]

### 2. Discord - Get Messages
- **Type**: nodes-base.discord
- **Version**: 2
- **Config**:
  ```json
  {
    "resource": "message",
    "operation": "getAll",
    "guildId": "={{$credentials.guildId}}",
    "channelId": "={{$credentials.channelId}}",
    "limit": 10,
    "returnAll": false
  }
  ```
- **Position**: [450, 300]

### 3. Set - Process Messages
- **Type**: nodes-base.set
- **Version**: 3.4
- **Config**:
  ```json
  {
    "mode": "manual",
    "assignments": {
      "assignments": [
        {
          "id": "1",
          "name": "messages",
          "value": "={{ $json }}",
          "type": "object"
        },
        {
          "id": "2",
          "name": "lastMessageId",
          "value": "={{ $json[0].id }}",
          "type": "string"
        }
      ]
    }
  }
  ```
- **Position**: [650, 300]

### 4. If - Filter New Messages
- **Type**: nodes-base.if
- **Version**: 2.2
- **Config**:
  ```json
  {
    "conditions": {
      "conditions": [
        {
          "id": "1",
          "leftValue": "={{ $json.author.bot }}",
          "rightValue": false,
          "operator": {
            "type": "boolean",
            "operation": "equals"
          }
        },
        {
          "id": "2",
          "leftValue": "={{ DateTime.fromISO($json.timestamp) > DateTime.now().minus({ seconds: 30 }) }}",
          "rightValue": true,
          "operator": {
            "type": "boolean",
            "operation": "equals"
          }
        }
      ],
      "combineOperation": "all"
    }
  }
  ```
- **Position**: [850, 300]

### 5. OpenAI Chat Model
- **Type**: nodes-langchain.lmChatOpenAi
- **Version**: 1.2
- **Config**:
  ```json
  {
    "model": "gpt-4o-mini",
    "options": {
      "temperature": 0.7,
      "maxTokens": 500
    }
  }
  ```
- **Position**: [1050, 200]

### 6. AI Agent
- **Type**: nodes-langchain.agent
- **Version**: 2.2
- **Config**:
  ```json
  {
    "promptType": "define",
    "text": "あなたは「（仮）デジタルソリューション部」のDiscordサーバーで活動する親切なAIアシスタントです。\n\nユーザーメッセージ: {{ $json.content }}\nユーザー名: {{ $json.author.username }}\n\n自然で親しみやすい応答を生成してください。技術的な質問にも対応できます。",
    "hasOutputParser": false
  }
  ```
- **Position**: [1050, 300]

### 7. Discord - Send Reply
- **Type**: nodes-base.discord
- **Version**: 2
- **Config**:
  ```json
  {
    "resource": "message",
    "operation": "send",
    "guildId": "={{$credentials.guildId}}",
    "channelId": "={{$node['Discord - Get Messages'].json.channelId}}",
    "message": "<@{{ $node['If - Filter New Messages'].json.author.id }}> {{ $json.output }}",
    "options": {}
  }
  ```
- **Position**: [1250, 300]

## 接続関係

```json
{
  "Schedule Trigger": {
    "main": [[{"node": "Discord - Get Messages", "type": "main", "index": 0}]]
  },
  "Discord - Get Messages": {
    "main": [[{"node": "Set - Process Messages", "type": "main", "index": 0}]]
  },
  "Set - Process Messages": {
    "main": [[{"node": "If - Filter New Messages", "type": "main", "index": 0}]]
  },
  "If - Filter New Messages": {
    "main": [
      [{"node": "AI Agent", "type": "main", "index": 0}],
      []
    ]
  },
  "OpenAI Chat Model": {
    "ai_languageModel": [[{"node": "AI Agent", "type": "ai_languageModel", "index": 0}]]
  },
  "AI Agent": {
    "main": [[{"node": "Discord - Send Reply", "type": "main", "index": 0}]]
  }
}
```

## 必要な認証情報

1. **Discord Bot**
   - Bot Token
   - Server (Guild) ID
   - Channel ID

2. **OpenAI**
   - API Key
EOF < /dev/null
