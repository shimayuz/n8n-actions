# Discord AI ChatBot 主要ステップ

## ワークフロー概要
DiscordでBotがメンションされた時に、GPT-4o-miniを使用して自動応答するワークフロー

## 主要ステップ（3-5）

### 1. Webhookでイベント受信
- Discord Botがメンションを検知
- WebhookエンドポイントでPOSTリクエストを受信
- メッセージデータを取得

### 2. AI Agentで応答生成
- 受信したメッセージをプロンプトとして使用
- GPT-4o-miniモデルで応答を生成
- エラーハンドリングを含む

### 3. Discordに応答送信
- 生成された応答をDiscordチャンネルに送信
- 元のメッセージに返信形式で送信
- 送信成功/失敗の確認

## データフロー
```
Webhook → AI Agent (+ OpenAI Model) → Discord
```

## エラーハンドリング
- Webhook: タイムアウト処理
- AI Agent: API制限やエラー時の代替応答
- Discord: 送信失敗時の再試行