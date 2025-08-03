# n8n特有のガイドライン

## workflow.md v2025.7 重要ポイント

### 1. ワークフロー作成前の必須手順
- **類似ワークフローリサーチ**: 新規作成前に必ず既存ワークフローを確認
- n8n-MCPツールで検索
- projectsディレクトリを確認
- 重複を避け、既存ワークフローの拡張を優先

### 2. JSON構造の必須要素
```json
{
  "name": "ワークフロー名",
  "nodes": [],
  "connections": {},
  "versionId": "UUID形式",
  "active": false,
  "settings": {
    "executionOrder": "v1",
    "saveExecutionProgress": true,
    "saveDataSuccessExecution": "all",  // 文字列！
    "saveDataErrorExecution": "all"     // 文字列！
  }
}
```

### 3. ノード設計原則
- 各ノードには一意のUUID形式IDが必須
- positionは[x, y]形式で指定
- typeは完全修飾名（例: "n8n-nodes-base.webhook"）
- credentialsは実際のn8nインスタンスで設定

### 4. 接続設計
- connections内でノード間の接続を定義
- 各接続は送信元ノードIDをキーとする
- mainは通常のデータフロー、main以外は特殊な出力

### 5. セキュリティ考慮事項
- 認証情報はJSONに含めない
- APIキーやパスワードは環境変数またはn8n Credentialsで管理
- Webhookは適切な認証メカニズムを実装

### 6. Kiro開発フロー統合
1. `/kiro:spec-init` で仕様初期化
2. requirements → design → tasks の順で作成
3. 各フェーズで人間のレビューが必要
4. tasks.mdに従って実装
5. 各タスク完了時にJSON検証とインポートテスト

### 7. GitHub Actions自動化
- phase-12-finalディレクトリに配置で自動検出
- PRが自動作成される
- ワークフローIDでn8nインスタンスと同期