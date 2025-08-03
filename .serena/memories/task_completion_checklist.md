# タスク完了時のチェックリスト

## n8nワークフロー作成完了時

### 1. 検証の実行
```bash
# ワークフローJSON検証
node scripts/validate-workflow.js workflows/[workflow-name].json
```

### 2. ファイル配置の確認
- [ ] ワークフローファイルが適切なディレクトリに配置されている
  - 本番: `workflows/` 直下または適切なサブディレクトリ
  - 開発中: `projects/[project-name]/phase-12-final/`
- [ ] ファイル名がkebab-caseで記述されている

### 3. workflow.md準拠の確認
- [ ] 必須フィールドがすべて含まれている
- [ ] settingsのデータ型が正しい（特にsaveDataSuccessExecution/saveDataErrorExecution）
- [ ] ノードIDがUUID形式
- [ ] 接続情報が正しく設定されている

### 4. Git操作
- [ ] featureブランチで作業している
- [ ] コミットメッセージがConventional Commits形式
- [ ] 不要なファイルがコミットに含まれていない

### 5. PR作成前の最終確認
- [ ] ワークフローの目的が明確
- [ ] 使用ノードの役割が文書化されている
- [ ] テスト方法が記載されている（可能な場合）
- [ ] workflow.md v2025.7準拠であることを明記

### 6. n8n-mcp検証（推奨）
```bash
# MCPツールでの検証
mcp__n8n-mcp__validate_workflow
```

## 一般的なコード変更完了時
- [ ] コードが意図通りに動作することを確認
- [ ] 必要に応じてドキュメントを更新
- [ ] エラーハンドリングが適切
- [ ] セキュリティ上の問題がない