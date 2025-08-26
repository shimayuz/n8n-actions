# GitHub統合ガイド

## 概要

Issues、プルリクエスト、Actions、自動デプロイパイプラインを含む、n8n ActionsとGitHubワークフローの統合に関する完全ガイド。

## GitHub Actionsのセットアップ

### 1. ワークフロー設定

`.github/workflows/n8n-actions.yml`を作成:

```yaml
name: n8n Actions ワークフローコンパイラ

on:
  pull_request:
    types: [opened, edited, synchronize]
  issues:
    types: [opened, edited, labeled]

jobs:
  generate-workflow:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Node.jsセットアップ
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: 依存関係のインストール
        run: npm ci
      
      - name: n8nワークフロー生成
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: node .github/scripts/generate-workflow.js
      
      - name: ワークフロー検証
        run: node scripts/validate-workflow.js
      
      - name: 変更のコミット
        if: success()
        uses: EndBug/add-and-commit@v9
        with:
          add: 'workflows/*.json'
          message: '🤖 n8n Actionsによるワークフロー生成'
```

### 2. シークレット管理

必要なGitHubシークレット:
- `ANTHROPIC_API_KEY`: Claude APIアクセス
- `N8N_API_KEY`: n8nインスタンスAPIキー
- `N8N_WEBHOOK_URL`: n8n webhookエンドポイント

## Issueテンプレート

### 1. ワークフローリクエストテンプレート

`.github/ISSUE_TEMPLATE/workflow-request.yml`:

```yaml
name: n8nワークフローリクエスト
description: 新しいn8nワークフローをリクエスト
title: "[WORKFLOW]: "
labels: ["workflow-request", "n8n-actions"]
body:
  - type: markdown
    attributes:
      value: |
        ## n8nワークフローリクエスト
        必要なワークフローを説明してください。n8n Actionsが生成します。
  
  - type: textarea
    id: description
    attributes:
      label: ワークフローの説明
      description: このワークフローは何をすべきか？
      placeholder: |
        以下のワークフローを作成:
        - Webhookからデータを受信
        - AIで処理
        - データベースに保存
    validations:
      required: true
  
  - type: dropdown
    id: trigger-type
    attributes:
      label: トリガータイプ
      options:
        - Webhook
        - スケジュール
        - 手動
        - メール
    validations:
      required: true
  
  - type: textarea
    id: nodes
    attributes:
      label: 必要なノード
      description: 既知の場合は特定のノードをリスト
      placeholder: |
        - OpenAI
        - PostgreSQL
        - Slack
```

### 2. バグレポートテンプレート

`.github/ISSUE_TEMPLATE/workflow-bug.yml`:

```yaml
name: ワークフローバグレポート
description: 生成されたワークフローのバグを報告
title: "[BUG]: "
labels: ["bug", "workflow-issue"]
body:
  - type: input
    id: workflow-file
    attributes:
      label: ワークフローファイル
      description: ワークフローファイル名
      placeholder: example.workflow.json
    validations:
      required: true
  
  - type: textarea
    id: error
    attributes:
      label: エラーの説明
      description: 何が問題でしたか？
    validations:
      required: true
```

## プルリクエストワークフロー

### 1. PRタイトル規約

セマンティックコミット形式を使用:
- `feat(workflow):` 新しいワークフロー機能
- `fix(workflow):` バグ修正
- `docs:` ドキュメント更新
- `refactor:` コード改善

### 2. PR説明フォーマット

```markdown
## n8nワークフロー生成

**ワークフロー名**: カスタマーサポートボット

**説明**: 
以下の自動カスタマーサポートワークフローを作成:
- Webhookでサポートチケットを受信
- AIで分類
- 適切なチームにルーティング
- 確認メールを送信

**必要なノード**:
- Webhookトリガー
- OpenAI Chat
- ルーター
- メール送信

**特別な要件**:
- エラーハンドリングを含める
- API呼び出しのリトライロジックを追加
- すべてのインタラクションをログ
```

### 3. 自動PR作成スクリプト

`.github/scripts/create-pr.js`:

```javascript
const { Octokit } = require('@octokit/rest');

async function createPR(workflowName, branchName) {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  const pr = await octokit.pulls.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title: `feat(workflow): ${workflowName}を追加`,
    head: branchName,
    base: 'main',
    body: `## 🤖 自動生成n8nワークフロー
    
### ワークフロー: ${workflowName}

Issue要件に基づいてn8n Actionsが生成。

### 変更内容
- 新しいワークフローを追加: \`workflows/${workflowName}.json\`
- JSON構造を検証済み
- ノード接続をテスト済み

### テスト
- [ ] n8nでインポートテスト済み
- [ ] すべてのノードが設定済み
- [ ] エラーハンドリング検証済み

---
*n8n Actionsにより生成*`
  });
  
  return pr.data;
}
```

## 自動テスト

### 1. ワークフロー検証アクション

```yaml
name: n8nワークフローの検証

on:
  push:
    paths:
      - 'workflows/*.json'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: すべてのワークフローを検証
        run: |
          for file in workflows/*.json; do
            echo "$fileを検証中"
            node scripts/validate-workflow.js "$file"
          done
      
      - name: インポートテスト
        run: |
          curl -X POST ${{ secrets.N8N_WEBHOOK_URL }}/test-import \
            -H "Content-Type: application/json" \
            -d @workflows/*.json
```

### 2. 統合テスト

```javascript
// .github/tests/integration.test.js
const { validateWorkflow } = require('../../scripts/validate-workflow');
const fs = require('fs');

describe('ワークフロー統合テスト', () => {
  test('すべてのワークフローが有効であること', () => {
    const files = fs.readdirSync('./workflows');
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const workflow = JSON.parse(fs.readFileSync(`./workflows/${file}`));
        expect(validateWorkflow(workflow).valid).toBe(true);
      }
    });
  });
});
```

## デプロイメントパイプライン

### 1. n8nへの自動デプロイ

```yaml
name: n8nへデプロイ

on:
  push:
    branches: [main]
    paths:
      - 'workflows/*.json'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: ワークフローをデプロイ
        run: |
          for file in workflows/*.json; do
            curl -X POST "${{ secrets.N8N_API_URL }}/workflows" \
              -H "X-N8N-API-KEY: ${{ secrets.N8N_API_KEY }}" \
              -H "Content-Type: application/json" \
              -d @"$file"
          done
```

### 2. ロールバック機構

```yaml
- name: 失敗時のロールバック
  if: failure()
  run: |
    git revert HEAD
    git push origin main
```

## GitHub API統合

### 1. Webhookハンドラ

```javascript
// api/github-webhook.js
exports.handler = async (event) => {
  const payload = JSON.parse(event.body);
  
  switch(payload.action) {
    case 'opened':
      if (payload.issue) {
        await handleIssueOpened(payload.issue);
      }
      break;
    case 'created':
      if (payload.comment) {
        await handleComment(payload.comment);
      }
      break;
  }
};
```

### 2. ステータス更新

```javascript
async function updatePRStatus(prNumber, status, description) {
  await octokit.repos.createCommitStatus({
    owner,
    repo,
    sha: headSha,
    state: status, // pending, success, failure
    description,
    context: 'n8n-actions/validation'
  });
}
```

## ベストプラクティス

### 1. ブランチ保護
- PRレビューを必須に
- ステータスチェックを有効化
- リニアヒストリーを強制

### 2. 自動化ルール
- レビュアーを自動割り当て
- パスに基づいて自動ラベル付け
- 古いIssueを自動クローズ

### 3. セキュリティ
- GitHub Secretsを使用
- Dependabotを有効化
- CODEOWNERSを実装

## 監視とアラート

### 1. アクション通知

```yaml
- name: Slackに通知
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "PR #${{ github.event.pull_request.number }}のワークフロー生成が失敗しました"
      }
```

### 2. メトリクスダッシュボード

追跡項目:
- ワークフロー生成成功率
- 平均生成時間
- エラー頻度
- PR処理時間

## トラブルシューティング

| 問題 | 解決方法 |
|------|----------|
| アクションがトリガーされない | ワークフロー構文とトリガーを確認 |
| APIレート制限 | キャッシングとリトライを実装 |
| 権限拒否 | トークン権限を確認 |
| Webhookが受信されない | Webhook設定を確認 |

---

*GitHub ActionsとN8n Actionsによって提供*