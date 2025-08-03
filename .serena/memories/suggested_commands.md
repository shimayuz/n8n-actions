# 開発時の推奨コマンド

## 基本的なGitコマンド
```bash
# 状態確認
git status
git log --oneline -n 10

# ブランチ操作
git checkout -b feature/workflow-[name]
git checkout main
git pull origin main

# コミット
git add workflows/[workflow-name].json
git commit -m "feat: add [workflow-name] workflow"
git push origin feature/workflow-[name]
```

## n8nワークフロー開発
```bash
# ワークフロー検証
node scripts/validate-workflow.js workflows/[workflow-name].json

# プロジェクト作成
mkdir -p projects/[project-name]/phase-12-final

# ファイルコピー
cp ~/Downloads/[workflow].json workflows/
```

## Kiroコマンド（仕様駆動開発）
```bash
# 仕様初期化
/kiro:spec-init [feature-name]

# 要件定義
/kiro:spec-requirements [feature-name]

# 設計
/kiro:spec-design [feature-name]

# タスク作成
/kiro:spec-tasks [feature-name]

# 進捗確認
/kiro:spec-status [feature-name]
```

## システムコマンド（macOS）
```bash
# ディレクトリ確認
ls -la
find . -name "*.json" -type f

# ファイル内容確認
cat filename.json
head -n 50 filename.json

# JSON整形
jq '.' workflow.json

# プロセス確認
ps aux | grep n8n
```

## GitHub CLI
```bash
# PR作成
gh pr create --title "feat: Add [workflow-name] workflow" --body "Description"

# PR一覧
gh pr list

# Issue作成
gh issue create --title "Title" --body "Description"
```