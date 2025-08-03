# プロジェクト構造

## ディレクトリ構成
```
n8n-workflows/
├── .github/                     # GitHub Actions設定
│   ├── workflows/              # CI/CDワークフロー
│   ├── actions/                # カスタムアクション
│   └── USAGE_GUIDE.md          # 使用ガイド
├── .kiro/                      # Kiro仕様管理
│   └── specs/                  # 各機能の仕様書
├── workflows/                  # n8nワークフローJSON
│   ├── samples/               # サンプルワークフロー
│   ├── integrations/          # 統合関連
│   ├── automation/            # 自動化
│   └── data-processing/       # データ処理
├── projects/                   # プロジェクト別ディレクトリ
│   └── [project-name]/        # 各プロジェクトの開発フェーズ
├── scripts/                    # ユーティリティスクリプト
│   ├── validate-workflow.js    # ワークフロー検証
│   └── github-actions/        # GitHub Actions用スクリプト
├── docs/                       # ドキュメント
├── CLAUDE.md                   # Claude Code設定
├── workflow.md                 # n8nワークフロー設計ガイド
└── mcp.json                    # MCP設定
```

## 重要ファイル
- `.workflow.json`: ワークフロー登録情報
- `.workflow-sync-state.json`: 同期状態管理
- `github-sync-workflow.json`: GitHub同期ワークフロー