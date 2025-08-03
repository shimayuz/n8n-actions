# コードスタイルとコンベンション

## n8nワークフローJSON規約
- **必須フィールド**: name, nodes, connections, versionId, active, settings
- **settings内のデータ型**:
  - `saveExecutionProgress`: boolean
  - `saveDataSuccessExecution`: string ("all" or "none")
  - `saveDataErrorExecution`: string ("all" or "none")
- **ワークフローID**: UUID形式を推奨
- **ノードID**: UUID形式必須

## ファイル命名規則
- ワークフローファイル: kebab-case (例: `slack-notification-on-error.json`)
- プロジェクトディレクトリ: kebab-case
- 説明的な名前を使用

## Gitコミット規約
- Conventional Commits形式を推奨
  - `feat:` 新機能
  - `fix:` バグ修正
  - `docs:` ドキュメント
  - `chore:` その他の変更

## 開発フロー規約
1. featureブランチで開発
2. PR作成前にワークフロー検証実行
3. workflow.md v2025.7準拠を確認
4. PRレビュー後にマージ