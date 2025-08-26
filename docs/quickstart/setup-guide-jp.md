# n8n Actionsセットアップガイド

## 前提条件

- n8nインスタンス（セルフホストまたはクラウド）
- GitHubアカウント
- Anthropic APIキー
- WebhookとAPIの基本的な理解

## 完全なセットアッププロセス

### ステップ1: GitHub Personal Access Token

1. GitHub設定 → Developer settings → Personal access tokens → Tokens (classic)に移動
2. 以下のスコープで新しいトークンを生成：
   - `repo`（プライベートリポジトリの完全制御）
   - `admin:repo_hook`（リポジトリフックの完全制御）
   - `workflow`（GitHub Actionワークフローの更新）
3. トークンをコピーして安全に保存

### ステップ2: Anthropic APIセットアップ

1. [Anthropic Console](https://console.anthropic.com/)にアクセス
2. アカウントを作成またはサインイン
3. APIキーセクションに移動
4. 新しいAPIキーを作成
5. キーを安全に保存

### ステップ3: n8n API設定

1. n8nで設定 → APIに移動
2. APIキーを生成
3. n8nインスタンスURLを記録
4. まだ有効でない場合はAPIアクセスを有効化

### ステップ4: リポジトリセットアップ

#### フォークとクローン
```bash
# まずGitHubでリポジトリをフォーク
# その後フォークをクローン
git clone https://github.com/YOUR-USERNAME/n8n-actions.git
cd n8n-actions
```

#### 依存関係のインストール
```bash
npm install
```

#### 環境変数の設定
`.env`ファイルを作成：
```env
# APIキー
ANTHROPIC_API_KEY=your-anthropic-key
N8N_API_KEY=your-n8n-api-key
GITHUB_TOKEN=your-github-token

# URL
N8N_BASE_URL=https://your-n8n-instance.com
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook

# 設定
GITHUB_OWNER=your-username
GITHUB_REPO=n8n-actions
```

### ステップ5: GitHub Actions設定

1. GitHubでリポジトリに移動
2. Settings → Secrets and variables → Actionsに移動
3. 以下のシークレットを追加：

| シークレット名 | 値 |
|---------------|-----|
| `ANTHROPIC_API_KEY` | Anthropic APIキー |
| `N8N_API_KEY` | n8n APIキー |
| `N8N_WEBHOOK_URL` | n8n webhook URL |
| `N8N_BASE_URL` | n8nインスタンスURL |

### ステップ6: コアワークフローのインポート

#### GitHub同期ワークフロー
1. `workflows/github-sync.workflow.json`をダウンロード
2. n8nで「ファイルからインポート」をクリック
3. ワークフローファイルを選択
4. 「インポート」をクリック

#### 自動生成ワークフロー
1. `workflows/auto-generate.workflow.json`をダウンロード
2. n8nにインポート
3. webhookパスを設定

### ステップ7: n8n認証情報の設定

#### GitHub認証情報
1. ワークフローで任意のGitHubノードをクリック
2. 「新規作成」認証情報を選択
3. 入力：
   - 名前: `GitHub`
   - アクセストークン: Personal Access Token
4. 保存

#### OpenAI/Claude認証情報
1. AIノードをクリック
2. 新しい認証情報を作成
3. 入力：
   - 名前: `Claude API`
   - APIキー: Anthropicキー
4. 保存

### ステップ8: ワークフロー変数の更新

1. 「ローカル変数定義」ノードを開く
2. 更新：
```javascript
{
  "github_owner": "YOUR-USERNAME",
  "github_repo": "n8n-actions",
  "n8n_instance_url": "https://your-n8n.com",
  "webhook_path": "github-sync"
}
```

### ステップ9: ワークフローの有効化

1. 各ワークフローを「アクティブ」に切り替え
2. webhook URLをテスト
3. 接続を確認

### ステップ10: GitHub Webhookセットアップ

1. リポジトリSettings → Webhooksに移動
2. webhookを追加：
   - ペイロードURL: `https://your-n8n.com/webhook/github-sync`
   - コンテンツタイプ: `application/json`
   - イベント: 個別のイベントを選択：
     - Pull requests
     - Issues
     - Push
3. webhookを保存

## 検証手順

### Webhook接続のテスト
```bash
curl -X POST https://your-n8n.com/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": "connection"}'
```

### ワークフロー生成のテスト
1. ワークフローリクエストでテストIssueを作成
2. ワークフローが生成されるか確認
3. PRが作成されるか確認

### GitHub同期のテスト
1. ワークフローに変更を加える
2. リポジトリにプッシュ
3. n8nワークフローが更新されるか確認

## 設定オプション

### 高度な設定

#### レート制限
```javascript
{
  "rateLimits": {
    "requestsPerMinute": 60,
    "requestsPerHour": 1000
  }
}
```

#### 自動デプロイ
```javascript
{
  "autoDeployment": {
    "enabled": true,
    "branches": ["main", "production"],
    "requireApproval": false
  }
}
```

#### エラーハンドリング
```javascript
{
  "errorHandling": {
    "retryAttempts": 3,
    "notifyOnError": true,
    "slackWebhook": "https://hooks.slack.com/..."
  }
}
```

## トラブルシューティング

### よくある問題

| 問題 | 解決方法 |
|------|----------|
| Webhookが受信されない | n8nワークフローがアクティブか確認 |
| API認証失敗 | APIキーが正しいか確認 |
| ワークフロー生成失敗 | Anthropic APIクォータを確認 |
| GitHub同期が動作しない | webhook設定を確認 |

### デバッグモード

デバッグログを有効化：
```javascript
// ワークフローのCodeノード内
console.log('Debug:', JSON.stringify($input.all(), null, 2));
```

### ヘルスチェック

ヘルスチェックスクリプトを実行：
```bash
node scripts/health-check.js
```

## セキュリティベストプラクティス

1. **APIキー管理**
   - 環境変数を使用
   - 定期的にキーをローテーション
   - キーをリポジトリにコミットしない

2. **Webhookセキュリティ**
   - 署名検証を実装
   - HTTPSのみ使用
   - GitHub IPをホワイトリスト化

3. **アクセス制御**
   - リポジトリ権限を制限
   - ブランチ保護を使用
   - すべてのアカウントで2FAを有効化

## メンテナンス

### 定期タスク
- 月次で依存関係を更新
- 四半期ごとにAPIキーをレビュー・ローテーション
- 週次でワークフローをバックアップ
- 毎日エラーログを監視

### n8n Actionsの更新
```bash
git pull upstream main
npm update
npm run test
```

## サポートリソース

- [n8nドキュメント](https://docs.n8n.io)
- [GitHub Actionsドキュメント](https://docs.github.com/actions)
- [Anthropic APIリファレンス](https://docs.anthropic.com)
- [コミュニティフォーラム](https://community.n8n.io)

---

*ヘルプが必要ですか？GitHubでIssueを開いてください*