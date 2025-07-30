# Discord Chatbot デプロイメント更新

## APIデプロイ試行結果
- **日時**: 2025-07-15
- **結果**: n8n MCP APIツールが利用不可

## 代替デプロイ方法

### オプション1: n8n CLI（推奨）
```bash
# n8n CLIのインストール
npm install -g n8n

# ワークフローのインポート
n8n import:workflow --input=/Users/heavenlykiss0820/n8n-workflows/workflows/discord-chatbot.json
```

### オプション2: n8n REST API
```bash
# n8n APIを使用（APIキーとURLが必要）
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: your-api-key" \
  -d @/Users/heavenlykiss0820/n8n-workflows/workflows/discord-chatbot.json
```

### オプション3: Web UI（最も簡単）
1. n8nダッシュボードにアクセス
2. 左メニューから「Workflows」を選択
3. 「Import from File」をクリック
4. `/workflows/discord-chatbot.json` を選択

## 完成したワークフロー概要
- **Webhook受信**: POST /discord-bot
- **Discord送信**: 「こんにちは！」メッセージ
- **エラーハンドリング**: 実装済み
- **検証**: ✅ 全チェック合格

## ファイル配置
- メインワークフロー: `/workflows/discord-chatbot.json`
- プロジェクト全体: `/projects/discord-chatbot/`

ワークフローは完全に動作可能な状態で保存されています。