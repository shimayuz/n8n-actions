# n8nワークフロー開発プロセス with GitHub Actions

## 概要

Claude AIとの対話を通じてn8nワークフローを開発する際、GitHub Actionsで全過程を自動記録する方法です。

## 1. セットアップ

### 1.1 プロジェクト構造
```
n8n-workflows/
├── .github/
│   ├── workflows/
│   │   └── n8n-workflow-development.yml
│   └── workflow-logs/
│       ├── task-history.log
│       ├── current-task.json
│       └── development-log.md
├── .kiro/
│   └── specs/
│       └── [feature-name]/
│           ├── spec.json
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
└── projects/
    └── [workflow-name]/
        ├── [workflow-name].json
        └── README.md
```

### 1.2 必要な設定

1. **GitHub Secrets**（オプション）:
   - `SLACK_WEBHOOK_URL`: Slack通知用

2. **Branch Protection**:
   - mainブランチの保護
   - PRレビュー必須化

## 2. 開発フロー

### 2.1 Spec-Driven Development（仕様駆動開発）

```bash
# 1. 仕様の作成
/kiro:spec-init [feature-name]
/kiro:spec-requirements [feature-name]
/kiro:spec-design [feature-name]
/kiro:spec-tasks [feature-name]

# 2. ブランチ作成
git checkout -b feature/[workflow-name]
```

### 2.2 タスク実行とコミット

各タスク完了時に意味のあるコミットを作成：

```bash
# タスク実装後
git add .
git commit -m "feat: implement Task 3.1 - Airtop API integration

- Added HTTP Request node for LinkedIn scraping
- Configured authentication headers
- Set up pagination handling
- Added error retry logic

Task: 3.1
Status: completed
Nodes added: 1"
```

### 2.3 GitHub Actions トリガー

**自動トリガー**:
- Push時: 進捗追跡、検証
- PR作成時: レポート生成

**手動トリガー**:
```bash
# GitHub UIまたはCLIから
gh workflow run n8n-workflow-development.yml \
  -f task_name="Task 4.1: Parallel API calls" \
  -f task_status="completed"
```

## 3. コミットメッセージ規約

```
<type>: <description>

<body>

Task: <task-number>
Status: <started|completed|blocked>
Nodes added: <count>
```

**Types**:
- `feat`: 新機能追加
- `fix`: バグ修正
- `refactor`: リファクタリング
- `docs`: ドキュメント更新
- `test`: テスト追加

## 4. 進捗追跡

### 4.1 自動生成されるレポート

**progress-report.md**:
- 総ノード数
- ノードタイプ分布
- 実装済み機能リスト

**development-log.md**:
- タイムスタンプ付き変更履歴
- コミット詳細
- 変更統計

### 4.2 タスク履歴

```bash
# タスク履歴の確認
cat .github/workflow-logs/task-history.log

# 出力例:
[2025-08-01 10:30:00 UTC] Task: Task 3.1 - Airtop API integration - Status: started
[2025-08-01 11:15:00 UTC] Task: Task 3.1 - Airtop API integration - Status: completed
```

## 5. ベストプラクティス

### 5.1 段階的開発

1. **最小限から開始**: トリガーノードのみ
2. **機能ごとに追加**: 1タスク = 1コミット
3. **都度検証**: 各段階でJSONバリデーション
4. **エラー時は即ロールバック**: 
   ```bash
   git reset --hard HEAD~1
   ```

### 5.2 Claude AIとの効率的な対話

```markdown
# 明確な指示例
"Task 4.1を実装して。並列API呼び出し構造を作成。
Clearbit、Hunter.io、Apollo.io、ZoomInfoを並列実行。
エラーハンドリングはcontinueOnFail: trueで。"

# 問題報告例
"インポートエラー発生。エラー: [具体的なエラーメッセージ]
最後に追加したノード: [ノード名]"
```

### 5.3 トラブルシューティング

```bash
# JSONバリデーション
jq empty workflow.json

# ノード数確認
jq '.nodes | length' workflow.json

# 特定ノードの検索
jq '.nodes[] | select(.name == "ノード名")' workflow.json

# 最新の変更確認
git diff HEAD~1 HEAD -- workflow.json
```

## 6. CI/CD統合

### 6.1 自動デプロイ（オプション）

```yaml
- name: Deploy to n8n instance
  if: github.ref == 'refs/heads/main'
  run: |
    curl -X POST https://your-n8n.com/api/v1/workflows \
      -H "X-N8N-API-KEY: ${{ secrets.N8N_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d @workflow.json
```

### 6.2 品質ゲート

- ノード数上限チェック（例: 100ノード以下）
- 必須ノードの存在確認
- 接続の整合性検証

## 7. 実例：今回の開発過程

1. **仕様作成**: Kiroコマンドで要件定義
2. **段階的実装**: Task 1-8を順次実装
3. **問題検出**: Task 9でのエラー発見
4. **ロールバック**: Task 8.4までを安定版として確定
5. **文書化**: README.mdで全機能を記録

## まとめ

GitHub Actionsを活用することで：
- ✅ 開発過程の完全な可視化
- ✅ 自動検証による品質保証
- ✅ チーム間での進捗共有
- ✅ 問題発生時の迅速な原因特定
- ✅ ナレッジの蓄積と再利用

この方法により、Claude AIとの対話を通じた開発でも、エンタープライズレベルの開発管理が可能になります。