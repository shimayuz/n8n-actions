# Discord AI ChatBot デプロイメントログ

## デプロイ情報
- **日時**: 2025-01-16
- **ワークフロー名**: Discord AI ChatBot
- **ファイル**: workflows/discord-ai-chatbot.json

## デプロイ前チェックリスト
- ✅ ワークフロー検証完了（エラーなし）
- ✅ ノード構成確認
- ✅ 認証情報プレースホルダー配置

## 必要な設定項目

### 1. Discord Bot設定
- **Bot ID**: `{{YOUR_BOT_ID}}`をParse Discord MessageノードのJavaScriptコード内で実際のBot IDに置換
- **Discord Bot Token**: n8nのCredentials画面で「Discord Bot」認証情報を作成

### 2. OpenAI API設定
- **API Key**: n8nのCredentials画面で「OpenAI API」認証情報を作成
- **モデル**: gpt-4o-mini（設定済み）

### 3. Webhook URL
- n8nワークフローをアクティブ化後、Webhookノードから生成されるURLをDiscord Botに設定

## セットアップ手順

1. **n8nでワークフローをインポート**
   ```bash
   # workflows/discord-ai-chatbot.jsonをn8nにインポート
   ```

2. **認証情報の設定**
   - OpenAI API認証情報を作成
   - Discord Bot認証情報を作成

3. **Bot IDの設定**
   - Parse Discord MessageノードのコードでBot IDを設定

4. **ワークフローをアクティブ化**
   - ワークフロー画面でActiveトグルをON

5. **Webhook URLの取得**
   - WebhookノードをクリックしてURLを確認
   - 例: `https://your-n8n-instance.com/webhook/discord-bot-webhook`

6. **Discord Botの設定**
   - Discord Developer PortalでWebhook URLを設定

## 動作確認
1. Discordでボットをメンション
2. n8nの実行履歴で処理を確認
3. AI応答がDiscordに返信されることを確認

## トラブルシューティング
- **Bot IDエラー**: Parse Discord MessageノードでBot IDが正しく設定されているか確認
- **認証エラー**: Credentials設定を確認
- **Webhook応答なし**: ワークフローがアクティブか確認

## 成果物
- ✅ workflows/discord-ai-chatbot.json作成完了
- ✅ プロジェクトディレクトリ構造完成
- ✅ ドキュメント一式完備