# Discord Chatbot ノード設計書

## ワークフロー構成

### 1. Webhook (トリガー)
**ノード名**: Webhook
**タイプ**: n8n-nodes-base.webhook
**設定**:
```json
{
  "httpMethod": "POST",
  "path": "discord-bot",
  "responseMode": "onReceived",
  "responseCode": 200
}
```

### 2. Discord送信
**ノード名**: Discord送信
**タイプ**: n8n-nodes-base.discord
**設定**:
```json
{
  "authentication": "webhook",
  "resource": "message",
  "operation": "send",
  "message": "こんにちは！"
}
```

## 接続関係
```
Webhook → Discord送信
```

## データフロー
1. Webhookが Discord からのPOSTリクエストを受信
2. 受信データをそのまま Discord送信ノードへ渡す
3. Discord送信ノードが固定メッセージを返信

## 必要な設定
- Discord Webhook URL (Discord送信ノードで使用)
- n8n Webhook URL (Discordサーバー側で設定)