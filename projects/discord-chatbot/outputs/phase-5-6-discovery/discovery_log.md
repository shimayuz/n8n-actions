# Discord Chatbot - ノード探索ログ

## 探索実施ノード

### 1. Webhook Node (nodes-base.webhook)
- **用途**: Discord からのメッセージ受信
- **タイプ**: トリガーノード
- **設定**: 
  - HTTP Method: POST
  - Path: discord-bot
  - Response Mode: onReceived (即座に応答)

### 2. Discord Node (nodes-base.discord)
- **用途**: Discord へのメッセージ送信
- **タイプ**: アウトプットノード
- **認証方法**:
  - Bot Token
  - OAuth2
  - Webhook

## 実装方針
Discordの仕組み上、単純なWebhookだけではメンション検知が難しいため、以下の構成を採用：

1. **Webhook受信** → Discord からのイベント受信
2. **条件分岐** → メンション判定
3. **Discord送信** → 返信メッセージ送信

## 必要な追加ノード
- **If Node**: メンション判定用
- **Set Node**: データ整形用