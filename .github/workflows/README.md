# GitHub Actions n8n Workflow Automation

このディレクトリには、n8nワークフローの自動生成、検証、PR作成、デプロイを行うGitHub Actionsワークフローが含まれています。

## 🚀 概要

このシステムは以下の機能を提供します：

1. **自動ワークフロー検出**: `projects/*/phase-*/`ディレクトリ内の新しいワークフローを自動検出
2. **自動PR作成**: 検出されたワークフローに対して自動的にfeatureブランチとPRを作成
3. **検証システム**: PR作成時にワークフローJSONを自動検証
4. **n8n同期**: PRマージ後、n8nインスタンスに自動デプロイ
5. **Playwrightデバッグ** (オプション): ブラウザ自動化によるワークフローテスト

## 📁 ファイル構成

```
.github/
├── workflows/
│   ├── workflow-generator.yml        # メインの自動化ワークフロー
│   ├── workflow-validator.yml        # PR検証ワークフロー
│   ├── sync-to-n8n.yml              # n8n同期ワークフロー
│   └── workflow-debug-playwright.yml # Playwrightデバッグワークフロー (オプション)
├── actions/
│   ├── validate-workflow/            # ワークフロー検証アクション
│   ├── create-workflow-pr/           # PR作成アクション
│   ├── sync-workflow/                # n8n同期アクション
│   └── playwright-test-workflow/     # Playwrightテストアクション
├── workflow-config.yml               # 設定ファイル
├── workflow-metrics.json             # メトリクスファイル
└── PULL_REQUEST_TEMPLATE/
    └── workflow.md                   # PRテンプレート
```

## 🔧 セットアップ

### 必要なシークレット

以下のシークレットをリポジトリに設定してください：

- `N8N_API_URL`: n8nインスタンスのAPI URL (例: `https://your-n8n.com/api/v1`)
- `N8N_API_KEY`: n8n APIキー

### 設定のカスタマイズ

`.github/workflow-config.yml`を編集して、以下の設定をカスタマイズできます：

- ワークフローのスキャンパス
- PRのデフォルトレビュアー
- 検証ルール
- 同期動作

## 📖 使用方法

### 手動実行

1. **ワークフロー生成器を手動実行**:
   - Actions → "n8n Workflow Generator and PR Creator" → "Run workflow"
   - オプションでスキャンパスと自動PR作成を指定

2. **特定のワークフローを同期**:
   - Actions → "Sync Workflows to n8n" → "Run workflow"
   - ワークフロー名を指定（空欄の場合は全て同期）

3. **Playwrightでデバッグ** (オプション):
   - Actions → "Debug n8n Workflow with Playwright" → "Run workflow"
   - デバッグモードとテスト範囲を指定

### 自動実行

- **Push時**: `projects/*/phase-*/`に新しいワークフローがpushされると自動実行
- **定期実行**: 毎日午前2時（UTC）に新しいワークフローをスキャン
- **PRマージ時**: `workflows/`ディレクトリへの変更がマージされるとn8nに自動同期

## 🧪 テスト手順

1. **新しいワークフローを作成**:
   ```bash
   cp workflows/samples/sample-webhook.json projects/test/phase-12-final/test-workflow.json
   ```

2. **変更をコミット**:
   ```bash
   git add projects/test/phase-12-final/test-workflow.json
   git commit -m "test: add test workflow"
   git push origin feature/test-deployment-system
   ```

3. **GitHub Actionsの実行を確認**:
   - Actionsタブで"n8n Workflow Generator"の実行を確認
   - 新しいPRが作成されることを確認

4. **PR検証を確認**:
   - 作成されたPRで検証が実行されることを確認
   - 検証結果がPRコメントに表示されることを確認

5. **オプション: Playwrightデバッグ**:
   - PRコメントで `/debug-workflow` と入力
   - またはActionsから手動実行

## 🛠️ トラブルシューティング

### ワークフローが検出されない

- `.workflow-sync-state.json`を確認して、既に処理済みでないか確認
- スキャンパスが正しいか`.github/workflow-config.yml`を確認

### 検証エラー

- `saveDataSuccessExecution`と`saveDataErrorExecution`が文字列型であることを確認
- 必須フィールド（name, nodes, connections, settings）が存在することを確認

### 同期エラー

- n8n APIのシークレットが正しく設定されているか確認
- n8nインスタンスがアクセス可能か確認

### Playwrightエラー

- ブラウザがインストールされているか確認: `npx playwright install chromium`
- n8nインスタンスのURLが正しいか確認

## 📊 メトリクス

`.github/workflow-metrics.json`でシステムのパフォーマンスメトリクスを確認できます：

- 処理されたワークフロー数
- 成功/失敗した同期数
- 平均処理時間

## 🔐 セキュリティ

- ワークフロー内の認証情報は自動的に削除されます
- APIキーはGitHubシークレットで保護されます
- PRは自動的にレビュアーが割り当てられます

## 🎭 Playwright デバッグ機能

オプションでPlaywrightを使用したビジュアルデバッグが可能です：

### 機能

- n8nへのワークフローインポートを実際のブラウザでテスト
- UI要素の検証とスクリーンショット撮影
- エラー発生時の詳細なデバッグ情報収集
- パフォーマンスメトリクスの測定

### 使用例

```yaml
# GitHub Actionsで実行
workflow_file: workflows/your-workflow.json
n8n_instance_url: https://your-n8n.com
debug_mode: detailed
test_execution: true
```

### 出力

- スクリーンショット（各ステップ）
- デバッグサマリー（Markdown形式）
- 詳細なテストレポート（JSON形式）

詳細は[使用ガイド](../USAGE_GUIDE.md#-playwright-デバッグ機能オプション)を参照してください。