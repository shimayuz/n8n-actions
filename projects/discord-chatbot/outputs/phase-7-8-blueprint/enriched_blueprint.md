# Discord Chatbot 詳細設計書

## ワークフロー詳細

### ノード詳細設定

#### 1. Webhook (ID: webhook)
```json
{
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2.1,
  "position": [250, 300],
  "webhookId": "discord-bot",
  "parameters": {
    "httpMethod": "POST",
    "path": "discord-bot",
    "responseMode": "onReceived",
    "responseCode": 200
  }
}
```

#### 2. Discord送信 (ID: discord)
```json
{
  "name": "Discord送信",
  "type": "n8n-nodes-base.discord",
  "typeVersion": 2,
  "position": [450, 300],
  "parameters": {
    "authentication": "webhook",
    "resource": "message",
    "operation": "send",
    "message": "こんにちは！",
    "channelId": "={{$json.channel_id}}"
  },
  "credentials": {
    "discordWebhookApi": {
      "id": "{{credentialId}}",
      "name": "Discord Webhook"
    }
  }
}
```

### 接続定義
```json
{
  "Webhook": {
    "main": [[
      {
        "node": "Discord送信",
        "type": "main",
        "index": 0
      }
    ]]
  }
}
```

### エラーハンドリング
- Webhookは常に200 OKを返す
- Discord送信エラーは n8n のエラーログに記録

### 実行順序
1. Webhook受信
2. Discord送信

### 注意事項
- Discord Webhook URLは事前に取得が必要
- channelIdは受信データから動的に取得