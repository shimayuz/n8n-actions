# n8n ワークフローリポジトリ

このリポジトリには、GitHub Actionsを使用してn8nインスタンスと自動同期されるn8nワークフローが含まれています。

## 🚀 概要

このリポジトリはn8nワークフロー用のCI/CDパイプラインを実装しています：
- **バージョン管理**: すべてのワークフローをGit内にJSONファイルとして保存
- **コードレビュー**: 変更はPRレビュープロセスを通過
- **自動同期**: マージされたPRはn8n内のワークフローを自動的に更新

## 📁 リポジトリ構造

```
workflows/           # n8nワークフローJSONファイル
├── samples/        # サンプルワークフロー（参考用のみ）
├── *.json          # 実際のワークフローファイルはここに配置
docs/               # ドキュメント
scripts/            # ユーティリティスクリプト
github-sync-workflow.json  # n8nにインポートする同期ワークフロー
```

### ディレクトリ使用ガイド

- **`workflows/`** - すべての本番ワークフローのメインディレクトリ
- **`workflows/samples/`** - 参考用のサンプルワークフロー（本番には同期されません）
- **`docs/`** - セットアップガイドとドキュメント
- **`scripts/`** - ワークフロー検証用ユーティリティスクリプト

## 🔧 セットアップ手順

### 1. このリポジトリをフォーク

このリポジトリをGitHubアカウントにフォークしてください。

### 2. GitHub Webhookの設定

1. GitHubリポジトリで Settings → Webhooks に移動
2. Webhookを追加：
   - **Payload URL**: `https://your-n8n-instance.com/webhook/github-workflow`
   - **Content type**: `application/json`
   - **Events**: "Pull requests" を選択
   - **Active**: ✓

### 3. n8nの設定

1. GitHub同期ワークフローをn8nにインポート
2. GitHub TriggerノードのWebhook URLを更新
3. 認証情報を設定：
   - GitHub APIトークン（`repo` および `admin:repo_hook` スコープ付き）
   - n8n API認証情報

### 4. 変数の更新

"Define Local Variables" ノードで：
- `github_owner`: あなたのGitHubユーザー名/組織名
- `repo_name`: `n8n-workflows`

## 📂 実際のワークフローファイルの配置

### ワークフローの配置場所

**本番ワークフローは `workflows/` ディレクトリに直接配置してください：**

```
workflows/
├── customer-onboarding.json       # ✓ 正しい配置
├── daily-backup-automation.json   # ✓ 正しい配置
├── slack-notifications.json       # ✓ 正しい配置
├── samples/                       # ❌ 本番ワークフロー用ではありません
│   ├── sample-webhook.json        # 参考用のみ
│   └── sample-data-processing.json # 参考用のみ
```

### ワークフローの整理（オプション）

より良い整理のためにサブディレクトリを作成できます：

```
workflows/
├── integrations/
│   ├── slack-error-notify.json
│   ├── teams-daily-report.json
│   └── discord-webhook.json
├── data-processing/
│   ├── csv-to-database.json
│   ├── api-data-sync.json
│   └── etl-pipeline.json
├── automation/
│   ├── backup-automation.json
│   ├── cleanup-old-files.json
│   └── scheduled-reports.json
└── samples/                       # サンプルは分離して保持
    └── ...
```

**注意:** GitHub同期ワークフローは、`workflows/` ディレクトリとそのサブディレクトリ内のすべての `.json` ファイルを処理します。

## 📝 ワークフロー管理

### 新しいワークフローの追加

1. **n8nからエクスポート:**
   - n8nでワークフローを開く
   - オプションメニュー（⋮）→ ダウンロード をクリック
   - JSONファイルを保存

2. **リポジトリに追加:**
   ```bash
   # workflowsディレクトリにコピー（samplesではありません！）
   cp ~/Downloads/my-new-workflow.json workflows/
   
   # またはカテゴリ別に整理する場合
   cp ~/Downloads/slack-integration.json workflows/integrations/
   ```

3. **コミットしてプッシュ:**
   ```bash
   git add workflows/my-new-workflow.json
   git commit -m "feat: 新しい顧客オンボーディングワークフローを追加"
   git push origin feature/new-workflow
   ```

4. **PRを作成してマージ**
   - プルリクエストを作成
   - マージ後、ワークフローが自動的にn8nに作成されます

### 既存ワークフローの更新

1. **n8nから更新版をエクスポート:**
   - n8nで変更を加える
   - 更新されたワークフローをダウンロード

2. **ファイルを置き換え:**
   ```bash
   # 既存ファイルを置き換え（同じファイル名を保持！）
   cp ~/Downloads/my-updated-workflow.json workflows/my-existing-workflow.json
   ```

3. **コミットしてプッシュ:**
   ```bash
   git add workflows/my-existing-workflow.json
   git commit -m "fix: 顧客ワークフローのエラーハンドリングを更新"
   git push origin fix/update-workflow
   ```

4. **PRを作成してマージ**
   - マージ後、ワークフローがn8nで更新されます
   - JSON内のワークフローIDにより正しいワークフローが更新されます

### ワークフロー命名規則

- ケバブケースを使用: `data-processing-workflow.json`
- 説明的にする: `slack-notification-on-error.json`
- 必要に応じてカテゴリプレフィックスを含める: `crm-hubspot-sync.json`

## 🔍 ワークフロー検証

コミット前にJSONを検証してください：

```bash
node scripts/validate-workflow.js workflows/your-workflow.json
```

## 📋 要件

- API アクセスが有効なn8nインスタンス
- PAT（Personal Access Token）付きのGitHubアカウント
- GitHubからアクセス可能なWebhookエンドポイント

## 🤝 貢献

1. フィーチャーブランチを作成
2. ワークフローを追加/修正
3. ローカルでテスト
4. PRを提出
5. レビューとマージを待つ

## 🔄 完全なワークフロー例

### 初期セットアップ
```bash
# 1. リポジトリをクローン
git clone https://github.com/shimayuz/n8n-workflows.git
cd n8n-workflows

# 2. github-sync-workflow.jsonをn8nにインポート
# 3. WebhookとCredentialsを設定
```

### 日常の操作
```bash
# 新しいフィーチャーブランチを作成
git checkout -b feature/add-salesforce-sync

# 新しいワークフローを追加
cp ~/Downloads/salesforce-sync.json workflows/integrations/

# ワークフローを検証
node scripts/validate-workflow.js workflows/integrations/salesforce-sync.json

# コミットしてプッシュ
git add workflows/integrations/salesforce-sync.json
git commit -m "feat: Salesforceデータ同期ワークフローを追加"
git push origin feature/add-salesforce-sync

# PR作成 → レビュー → マージ → n8nに自動同期 ✓
```

## ⚠️ 重要な注意事項

- **ワークフローID**: 同期プロセスはワークフローIDを保持します
- **アクティブ状態**: ワークフローはアクティブ/非アクティブ状態を維持します
- **認証情報**: 認証情報は同期されません（n8nで手動設定してください）
- **バックアップ**: 重要な変更前は常に重要なワークフローをバックアップしてください
- **ファイル配置**: 実際のワークフローは `workflows/` に配置し、`samples/` には配置しないでください
- **ファイル名**: 既存ワークフローのファイル名は変更しないでください（更新リンクが壊れます）
- **検証**: コミット前は常にJSONを検証してください

## 📚 リソース

- [n8n ドキュメント](https://docs.n8n.io)
- [n8n API リファレンス](https://docs.n8n.io/api/)
- [GitHub Webhooks ガイド](https://docs.github.com/en/developers/webhooks-and-events/webhooks) 