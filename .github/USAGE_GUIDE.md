# 📚 n8n GitHub Actions 自動化システム使用ガイド

このガイドでは、n8nワークフローの自動生成・PR作成・デプロイシステムの使用方法を詳しく説明します。

## 📋 目次

1. [初期設定](#初期設定)
2. [基本的な使い方](#基本的な使い方)
3. [高度な使い方](#高度な使い方)
4. [トラブルシューティング](#トラブルシューティング)
5. [ベストプラクティス](#ベストプラクティス)

## 🚀 初期設定

### 1. 必須のGitHubシークレット設定

リポジトリの Settings → Secrets and variables → Actions で以下を設定：

| シークレット名 | 説明 | 例 |
|--------------|------|-----|
| `N8N_API_URL` | n8nインスタンスのAPI URL | `https://your-n8n.com/api/v1` |
| `N8N_API_KEY` | n8n APIキー | `n8n_api_xxxxx` |

### 2. ラベルの作成（推奨）

システムは以下のラベルを使用します（存在しない場合は自動スキップ）：

| ラベル名 | 用途 | 色（推奨） |
|---------|------|-----------|
| `workflow` | ワークフロー関連PR | #0052CC |
| `auto-generated` | 自動生成されたPR | #FBCA04 |
| `validation-passed` | 検証成功 | #0E8A16 |
| `validation-failed` | 検証失敗 | #D93F0B |
| `bug` | エラー報告Issue | #D73A4A |
| `workflow-sync` | 同期関連Issue | #5319E7 |

**作成方法**:
```bash
# GitHub CLIを使用
gh label create workflow --description "n8n workflow related" --color 0052CC
gh label create auto-generated --description "Automatically generated" --color FBCA04
gh label create validation-passed --description "Validation passed" --color 0E8A16
gh label create validation-failed --description "Validation failed" --color D93F0B
```

### 3. 権限の確認

Actions → General → Workflow permissions で以下を確認：
- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

### 3. 初回セットアップの確認

```bash
# ファイル構造の確認
ls -la .github/workflows/
ls -la .github/actions/
ls -la scripts/github-actions/

# 設定ファイルの確認
cat .github/workflow-config.yml
```

## 📖 基本的な使い方

### ワークフロー自動検出＆PR作成

#### 方法1: 自動トリガー（推奨）

1. **新しいワークフローを配置**:
   ```bash
   # プロジェクトのfinalフェーズに配置
   cp your-workflow.json projects/your-project/phase-12-final/
   ```

2. **コミット＆プッシュ**:
   ```bash
   git add projects/your-project/phase-12-final/your-workflow.json
   git commit -m "feat: add your-workflow"
   git push origin main
   ```

3. **自動処理の確認**:
   - GitHub Actions タブで実行状況を確認
   - 自動的にfeatureブランチとPRが作成される

#### 方法2: 手動実行

1. **GitHub Actions ページへ移動**:
   - リポジトリ → Actions → "n8n Workflow Generator and PR Creator"

2. **Run workflow をクリック**:
   ```
   scan_path: projects/*/phase-12-final/*.json  # カスタムパス（オプション）
   auto_create_pr: true                         # 自動PR作成
   ```

3. **実行結果の確認**:
   - Summary でスキャン結果を確認
   - Pull requests タブで新しいPRを確認

### PR の確認とマージ

1. **自動生成されたPRを開く**:
   - タイトル例: `feat: Add discord-chatbot workflow`

2. **検証結果を確認**:
   - ✅ Workflow Validation のチェック
   - コメントで詳細な検証レポートを確認

3. **必要に応じて修正**:
   ```bash
   # PRのブランチをチェックアウト
   git checkout feature/workflow-discord-chatbot
   
   # 修正を実施
   vim workflows/discord-chatbot.json
   
   # コミット＆プッシュ
   git add workflows/discord-chatbot.json
   git commit -m "fix: update webhook URL"
   git push
   ```

4. **マージ**:
   - レビュー完了後、"Merge pull request" をクリック

### n8n への自動同期

マージ後、自動的に以下が実行されます：

1. **同期ワークフローの起動**:
   - `sync-to-n8n.yml` が自動実行

2. **同期状況の確認**:
   - Actions タブで "Sync Workflows to n8n" を確認
   - Deployments で同期結果を確認

3. **n8nでの確認**:
   - n8nインスタンスにログイン
   - Workflows でインポートされたワークフローを確認

## 🔧 高度な使い方

### 特定のワークフローを手動同期

```bash
# GitHub Actions で手動実行
workflow_name: discord-chatbot  # .json拡張子なし
dry_run: false                  # 実際に同期する
```

### バッチ処理

複数のワークフローを一括処理：

```bash
# 複数のワークフローを配置
cp workflow1.json projects/batch/phase-12-final/
cp workflow2.json projects/batch/phase-12-final/
cp workflow3.json projects/batch/phase-12-final/

# 一括コミット
git add projects/batch/phase-12-final/*.json
git commit -m "feat: add batch workflows"
git push
```

### カスタムスキャンパスの設定

`.github/workflow-config.yml` を編集：

```yaml
workflow_settings:
  source_paths:
    - projects/*/phase-12-final/*.json
    - projects/*/phase-7-final/*.json
    - custom/path/to/workflows/*.json  # 追加
```

### 検証ルールのカスタマイズ

```yaml
validation:
  mode: strict  # strict モードを有効化
  required_fields:
    - name
    - nodes
    - connections
    - settings
    - description  # 説明を必須に
```

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### 1. ワークフローが検出されない

**症状**: pushしてもActionsが動かない

**確認事項**:
```bash
# 状態ファイルを確認
cat .workflow-sync-state.json

# 既に処理済みの場合はリセット
node scripts/github-actions/workflow-scanner.js reset
```

#### 2. 検証エラー

**症状**: PR検証が失敗する

**よくあるエラー**:
```json
// ❌ 間違い
"settings": {
  "saveDataSuccessExecution": true,  // boolean
  "saveDataErrorExecution": false    // boolean
}

// ✅ 正しい
"settings": {
  "saveDataSuccessExecution": "all",  // string
  "saveDataErrorExecution": "none"    // string
}
```

#### 3. 同期エラー

**症状**: n8nへの同期が失敗

**確認事項**:
1. シークレットが正しく設定されているか
2. n8n APIが有効か
3. APIキーの権限が十分か

**デバッグ**:
```bash
# ドライランで確認
workflow_name: your-workflow
dry_run: true
```

#### 4. PR作成エラー

**症状**: ブランチは作成されるがPRが作成されない

**解決方法**:
```bash
# 手動でPRを作成
gh pr create \
  --title "feat: Add workflow-name workflow" \
  --body-file .github/PULL_REQUEST_TEMPLATE/workflow.md \
  --base main \
  --head feature/workflow-workflow-name
```

### ログの確認方法

1. **GitHub Actions ログ**:
   - Actions → 該当のワークフロー実行 → ジョブをクリック

2. **同期状態の確認**:
   ```bash
   # 処理済みワークフロー一覧
   node scripts/github-actions/workflow-scanner.js list
   
   # メトリクスの確認
   cat .github/workflow-metrics.json | jq .
   ```

## 🎭 Playwright デバッグ機能（オプション）

### 概要

PlaywrightMCPを使用して、n8nワークフローのインポートと実行を実際のブラウザでテストできます。これにより、UI関連の問題や実行時エラーを事前に検出できます。

### 使用方法

#### 1. 手動デバッグ実行

GitHub Actions → "Debug n8n Workflow with Playwright" → Run workflow

**入力パラメータ**:
```yaml
workflow_file: workflows/discord-chatbot.json  # デバッグするワークフロー
n8n_instance_url: https://your-n8n.com        # n8nインスタンス（オプション）
debug_mode: detailed                           # basic/detailed/screenshot
test_execution: true                           # ワークフロー実行もテスト
```

#### 2. PRでの自動デバッグ

PRコメントでトリガー:
```
/debug-workflow detailed
```

#### 3. ローカルでのデバッグ

```bash
# 基本的なテスト
node scripts/github-actions/playwright-workflow-tester.js \
  workflows/your-workflow.json \
  http://localhost:5678

# デバッグモード（ブラウザ表示）
node scripts/github-actions/playwright-workflow-tester.js \
  workflows/your-workflow.json \
  http://localhost:5678 \
  --headless=false \
  --debug \
  --capture-debug
```

### デバッグレポート

テスト完了後、以下のレポートが生成されます：

1. **デバッグサマリー** (`debug-summary.md`):
   - 実行したテストのリスト
   - 検出されたエラーと警告
   - パフォーマンスメトリクス

2. **スクリーンショット**:
   - n8nホーム画面
   - インポートダイアログ
   - ワークフローエディタ
   - 実行結果

3. **詳細レポート** (`debug-report.json`):
   - 完全なテスト結果
   - エラースタックトレース
   - ネットワークログ

### トラブルシューティング

#### Playwrightエラー

**症状**: "Browser not installed"
```bash
# ブラウザをインストール
npx playwright install chromium
```

**症状**: "Timeout waiting for selector"
```yaml
# タイムアウトを延長
timeout: 120000  # 2分
```

#### n8n接続エラー

**症状**: "Failed to connect to n8n"
- n8nインスタンスがアクセス可能か確認
- 認証が必要な場合はログイン状態を確認
- HTTPSの場合は証明書エラーを確認

### ベストプラクティス

1. **定期的なデバッグテスト**:
   - 重要なワークフローは週次でテスト
   - UIアップデート後は全ワークフローをテスト

2. **スクリーンショット活用**:
   - エラー時は必ずスクリーンショット確認
   - UI変更の影響を視覚的に確認

3. **パフォーマンス監視**:
   - インポート時間が3秒を超える場合は要調査
   - 実行時間の急激な増加に注意

## 💡 ベストプラクティス

### 1. ワークフロー命名規則

```
✅ 良い例:
- discord-chatbot.json
- slack-notification.json
- data-sync-daily.json

❌ 避けるべき例:
- test.json
- workflow1.json
- 新しいワークフロー.json
```

### 2. コミットメッセージ

```bash
# 新規追加
git commit -m "feat: add discord notification workflow"

# 更新
git commit -m "fix: update webhook URL in discord workflow"

# 削除
git commit -m "remove: delete deprecated legacy workflow"
```

### 3. ワークフロー説明の記載

```json
{
  "name": "Discord Notification Bot",
  "description": "Sends notifications to Discord when specific events occur",
  // ... 説明は必ず記載
}
```

### 4. テスト手順の文書化

PRテンプレートのテスト手順セクションを必ず記入：
- 必要な認証情報
- テストデータ
- 期待される結果

### 5. 定期的なメンテナンス

```bash
# 月次でメトリクスを確認
cat .github/workflow-metrics.json | jq '.automation_metrics'

# 不要な処理済み記録をクリーンアップ
node scripts/github-actions/workflow-scanner.js reset
```

## 📊 メトリクスとモニタリング

### パフォーマンス指標の確認

```bash
# 同期成功率
cat .github/workflow-metrics.json | jq '.automation_metrics.successful_syncs'

# 平均処理時間
cat .github/workflow-metrics.json | jq '.performance.average_sync_duration'
```

### アラートの設定

失敗時は自動的にIssueが作成されます：
- ラベル: `bug`, `workflow-sync`
- アサイン: 設定されたレビュアー

## 🔒 セキュリティ考慮事項

1. **認証情報の取り扱い**:
   - ワークフロー内の認証情報は自動削除
   - シークレットは環境変数で管理

2. **アクセス制御**:
   - PRは必ずレビューが必要
   - 直接mainへのpushは禁止推奨

3. **監査ログ**:
   - 全ての操作はGitHub Actionsログに記録
   - デプロイメント履歴で追跡可能

## 🆘 サポート

問題が解決しない場合：

1. **Issue作成**:
   ```
   タイトル: [GitHub Actions] 具体的な問題
   本文:
   - 実行したコマンド
   - エラーメッセージ
   - 期待される動作
   ```

2. **ログの添付**:
   - GitHub Actionsの実行ログ
   - 関連するワークフローJSON

---

最終更新: 2025年1月30日