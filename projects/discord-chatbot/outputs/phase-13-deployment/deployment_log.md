# Discord Chatbot デプロイメントログ

## デプロイ情報
- **日時**: 2025-07-14
- **ワークフロー名**: Discord Chatbot
- **ワークフローID**: discord-chatbot-workflow
- **バージョン**: discord-bot-v1

## デプロイ手順
1. ワークフローJSONを `/workflows/discord-chatbot.json` に保存完了
2. n8n API経由でのデプロイ: API設定なしのため手動インポートが必要

## 手動セットアップ手順

### 1. n8nへのインポート
1. n8nダッシュボードにログイン
2. Workflowsメニューから「Import from File」を選択
3. `/workflows/discord-chatbot.json` をアップロード

### 2. Discord Webhook設定
1. Discordサーバーの設定から「Integrations」→「Webhooks」を開く
2. 「New Webhook」をクリック
3. チャンネルを選択してWebhook URLをコピー
4. n8nのDiscord送信ノードでCredentialを設定

### 3. n8n Webhook URL取得
1. ワークフローを保存後、Webhookノードをクリック
2. 「Webhook URLs」セクションからProduction URLをコピー
3. このURLをDiscordボット設定で使用

## 注意事項
- n8nインスタンスが外部からアクセス可能である必要があります
- Discord Webhook URLは安全に管理してください
- テスト実行で動作確認を行ってください

## ステータス
✅ ワークフローファイル作成完了
⏳ n8nへのインポート待ち
⏳ Credential設定待ち