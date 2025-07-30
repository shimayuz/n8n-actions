# Discord Chatbot ワークフロー - デプロイ完了

## ワークフロー作成状況
✅ ワークフローJSON作成完了
❌ API経由での自動作成（Internal Server Errorのため手動インポートが必要）

## 手動インポート手順

### 1. n8nにアクセス
https://n8n.composition2940.com

### 2. ワークフローインポート
1. 左メニューの「Workflows」をクリック
2. 右上の「...」メニューから「Import from URL」または「Import from File」を選択
3. ファイルを選択: `/Users/heavenlykiss0820/n8n-workflows/workflows/discord-chatbot-ai.json`

### 3. 必要な設定
インポート後、以下の設定が必要です：

#### Discord認証情報
- Discord Get Messagesノード
- Discord Send Replyノード
- → Credentials > Create New > Discord Bot Token入力

#### OpenAI認証情報  
- OpenAI Chat Modelノード
- → Credentials > Create New > API Key入力

#### Server/Channel設定
- Discord Get Messagesノードで対象サーバーとチャンネルを選択

### 4. ワークフロー有効化
右上のトグルスイッチをONにする

## ワークフロー内容
- 30秒間隔でDiscordチャンネルをポーリング
- 新規メッセージをAI（OpenAI）で処理
- 自然な日本語で応答

## 保存場所
`workflows/discord-chatbot-ai.json`
EOF < /dev/null
