# Discord Chatbot デプロイメントログ

## デプロイ日時
2025-01-15

## ワークフロー概要
- **名称**: Discord Chatbot with AI
- **ID**: discord-chatbot-ai
- **バージョン**: 1.0.0

## ファイル保存先
- 開発フェーズ: outputs/phase-*/
- 最終版: workflows/discord-chatbot-ai.json

## セットアップ手順

### 1. Discord Bot作成
1. Discord Developer Portal (https://discord.com/developers/applications) にアクセス
2. "New Application"でアプリ作成
3. Bot設定でTokenを取得
4. OAuth2 > URL Generatorで権限設定:
   - Bot権限: Send Messages, Read Message History, View Channels
5. 生成されたURLでBotをサーバーに招待

### 2. n8n設定
1. Credentials > New > Discord Bot
   - Bot Token貼り付け
2. Credentials > New > OpenAI
   - API Key貼り付け
3. ワークフローインポート
4. Discord Get/Sendノードで:
   - Server選択
   - Channel選択
5. ワークフローを"Active"に変更

## 動作確認
1. 指定チャンネルでメッセージ送信
2. 30秒以内にボットが応答することを確認

## トラブルシューティング
- 応答なし: Bot権限とチャンネル権限確認
- エラー: Execution logで詳細確認
- API制限: OpenAI/Discord制限確認

## 今後の拡張案
- Webhookトリガー版（リアルタイム応答）
- コマンド機能追加
- 会話履歴保持
- マルチサーバー対応
EOF < /dev/null
