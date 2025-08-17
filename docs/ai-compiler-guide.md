# 🤖 n8n AI Workflow Compiler - 使用ガイド

## 概要

n8n AI Workflow Compilerは、自然言語の指示からn8nワークフローを自動生成し、エラーがあれば自己修正する革新的なCI/CDパイプラインです。GitHub ActionsとClaude APIを組み合わせ、「プロンプトコード」という新しいパラダイムを実現します。

## ✨ 主な機能

- **自然言語からワークフロー生成**: PR本文に記述した指示から自動的にn8nワークフローを生成
- **自己修正メカニズム**: 生成されたワークフローにエラーがあれば自動的に修正（最大3回試行）
- **完全自動化**: PRを作成するだけで、検証済みのワークフローが自動コミット
- **詳細なフィードバック**: PR上に生成結果を分かりやすくレポート

## 🚀 セットアップ

### 1. 必要な準備

#### Anthropic API キーの取得
1. [Anthropic Console](https://console.anthropic.com/)にアクセス
2. API Keysセクションで新しいキーを生成
3. キーを安全に保管

#### GitHubシークレットの設定
1. リポジトリの`Settings` → `Secrets and variables` → `Actions`に移動
2. `New repository secret`をクリック
3. 以下のシークレットを追加:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: 取得したAnthropicのAPIキー

### 2. ディレクトリ構造

```
your-repo/
├── .github/
│   ├── workflows/
│   │   └── n8n-ai-compiler.yml    # メインワークフロー
│   └── scripts/
│       ├── generate-workflow.js    # ワークフロー生成スクリプト
│       └── correct-workflow.js     # 自己修正スクリプト
├── workflows/                       # n8nワークフローを配置
│   └── *.workflow.json
├── n8n_specs/                      # ワークフロー仕様書（オプション）
│   └── *.md
└── scripts/
    └── validate-workflow.js        # 検証スクリプト
```

## 📝 使い方

### 方法1: 新規ワークフローの生成

1. **新しいブランチを作成**
   ```bash
   git checkout -b feature/new-workflow
   ```

2. **空のJSONファイルまたは仕様書を作成**
   ```bash
   # オプション1: 空のワークフローファイル
   echo '{}' > workflows/my-workflow.workflow.json
   
   # オプション2: 仕様書
   echo '# My Workflow Spec' > n8n_specs/my-workflow.md
   ```

3. **変更をコミット**
   ```bash
   git add .
   git commit -m "Add new workflow placeholder"
   git push origin feature/new-workflow
   ```

4. **PRを作成し、本文に指示を記述**
   ```markdown
   ## ワークフロー生成指示
   
   以下の機能を持つn8nワークフローを作成してください：
   
   1. Discordからメッセージを受信
   2. OpenAI GPT-4でメッセージを処理
   3. 結果をDiscordに返信
   
   必要な設定：
   - Webhookトリガーを使用
   - エラーハンドリングを含める
   - すべての実行データを保存
   ```

5. **自動生成を待つ**
   - GitHub ActionsがPRを検出し、自動的にワークフローを生成
   - 生成結果がPRにコメントとして投稿される

### 方法2: 既存ワークフローの修正

1. **既存のワークフローファイルを編集**
   ```bash
   git checkout -b fix/workflow-bug
   # workflows/existing-workflow.jsonを編集
   ```

2. **PRを作成し、修正内容を記述**
   ```markdown
   ## 修正内容
   
   既存のワークフローに以下の修正を加えてください：
   
   - ノードIDの重複を修正
   - 接続エラーを解決
   - 設定値を正しい形式に変更
   ```

## 🔧 高度な使い方

### カスタムプロンプトテンプレート

PR本文でXMLタグを使用して、より詳細な指示を提供できます：

```xml
<workflow_name>
Customer Support Automation
</workflow_name>

<description>
顧客サポートチケットを自動的に分類し、適切な担当者に割り当てるワークフロー
</description>

<requirements>
- Webhookでチケット情報を受信
- AIで内容を分析し、カテゴリを判定
- カテゴリに基づいて担当者を決定
- Slackに通知を送信
</requirements>

<error_handling>
- すべてのノードにエラーハンドリングを実装
- エラー時は管理者に通知
</error_handling>
```

### デバッグ情報の確認

生成プロセスで問題が発生した場合、GitHub Actionsのログで詳細を確認できます：

1. リポジトリの`Actions`タブに移動
2. 該当するワークフロー実行をクリック
3. 各ステップのログを展開して詳細を確認

## ⚠️ 制限事項と注意点

### トークン制限
- Claude APIには最大トークン数の制限があります（8192トークン）
- 非常に大規模なワークフローの場合、生成に失敗する可能性があります

### コスト管理
- Claude API呼び出しには料金が発生します
- 自己修正ループは最大3回に制限されています
- 使用量を監視し、必要に応じて制限を調整してください

### セキュリティ
- APIキーは必ずGitHubシークレットとして管理
- 生成されたワークフローに機密情報を含めない
- PRは必ず人間がレビューしてからマージ

## 🛠️ トラブルシューティング

### よくある問題と解決方法

#### 1. APIキーエラー
```
Error: ANTHROPIC_API_KEY is not set
```
**解決方法**: GitHubシークレットが正しく設定されているか確認

#### 2. JSON構文エラー
```
JSON syntax is invalid
```
**解決方法**: 自己修正ループが自動的に修正を試みます。3回失敗した場合は、PR本文の指示をより明確にしてください

#### 3. ワークフロー検証エラー
```
Workflow structure is invalid
```
**解決方法**: n8nの仕様に準拠していない可能性があります。エラーメッセージを確認し、必要に応じて手動で修正

## 📚 リファレンス

### サポートされているn8nノードタイプ

AIコンパイラは以下の主要なノードタイプを認識し、生成できます：

- `n8n-nodes-base.webhook` - Webhookトリガー
- `@n8n/n8n-nodes-langchain.agent` - AIエージェント
- `n8n-nodes-base.discord` - Discord統合
- `n8n-nodes-base.code` - カスタムJavaScript
- `@n8n/n8n-nodes-langchain.lmChatOpenAi` - OpenAIモデル
- `@n8n/n8n-nodes-langchain.mcpTrigger` - MCPサーバー
- `@n8n/n8n-nodes-langchain.mcpClientTool` - MCPクライアント

### ワークフロー設定の重要なポイント

```json
{
  "settings": {
    "executionOrder": "v1",
    "saveExecutionProgress": true,
    "saveDataSuccessExecution": "all",  // 文字列であること！
    "saveDataErrorExecution": "all"     // 文字列であること！
  }
}
```

## 🤝 貢献

このプロジェクトへの貢献を歓迎します！

1. Issueで機能提案やバグ報告
2. PRで改善提案
3. ドキュメントの改善

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

**注意**: このAIコンパイラは開発支援ツールです。生成されたワークフローは必ず人間がレビューし、テストしてから本番環境で使用してください。