# ❓ よくある質問（FAQ）

## 目次

- [セットアップに関する質問](#セットアップに関する質問)
- [ワークフロー生成に関する質問](#ワークフロー生成に関する質問)
- [エラー・トラブルシューティング](#エラートラブルシューティング)
- [高度な使い方](#高度な使い方)
- [料金・ライセンス](#料金ライセンス)

---

## セットアップに関する質問

### Q1: Anthropic APIキーはどこで取得できますか？

**A**: 以下の手順で取得できます：

1. [Anthropic Console](https://console.anthropic.com/)にアクセス
2. アカウントを作成（無料）
3. 「API Keys」セクションへ移動
4. 「Create Key」をクリック
5. キーをコピーして安全に保管

**料金について**：
- 無料トライアル：$5分のクレジット付与
- 従量課金：使用量に応じて課金
- 目安：1ワークフロー生成 = 約$0.02-0.05

---

### Q2: GitHub Actionsが動かないのですが？

**A**: 以下を確認してください：

1. **Actionsが有効になっているか**
   ```
   Settings → Actions → General → Actions permissions
   → "Allow all actions and reusable workflows" を選択
   ```

2. **シークレットが正しく設定されているか**
   ```
   Settings → Secrets and variables → Actions
   → ANTHROPIC_API_KEY が存在することを確認
   ```

3. **ワークフローファイルに構文エラーがないか**
   ```bash
   # ローカルで検証
   npm run validate-workflows
   ```

4. **フォークしたリポジトリの場合**
   - フォークではデフォルトでActionsが無効
   - Actionsタブで明示的に有効化が必要

---

### Q3: n8nインスタンスは必要ですか？

**A**: いいえ、ワークフロー生成だけなら不要です。

- **生成のみ**：n8nインスタンス不要
- **テスト実行**：n8nインスタンスが必要
- **本番デプロイ**：n8nインスタンスが必要

**n8nのセットアップ方法**：

```bash
# Docker を使った簡単セットアップ
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

---

## ワークフロー生成に関する質問

### Q4: どんなワークフローが生成できますか？

**A**: 以下のようなワークフローが生成可能です：

| カテゴリ | 例 |
|---------|-----|
| **基本** | Webhook、スケジュール実行、データ変換 |
| **AI/ML** | ChatGPT連携、画像認識、感情分析 |
| **データ処理** | ETL、バッチ処理、データ同期 |
| **通信** | Slack、Discord、メール、SMS |
| **業務自動化** | 請求書処理、在庫管理、レポート生成 |
| **開発** | CI/CD通知、エラー監視、デプロイ自動化 |

詳細は[実例集](EXAMPLES-jp.md)を参照してください。

---

### Q5: 生成に失敗する理由は？

**A**: 主な原因と対策：

1. **要件が不明確**
   ```markdown
   ❌ 悪い例：「便利なワークフローを作って」
   ✅ 良い例：「Slackに毎朝9時に天気予報を投稿するワークフロー」
   ```

2. **統合サービスの指定ミス**
   ```markdown
   ❌ 悪い例：「メッセージアプリ」
   ✅ 良い例：「Slack」「Discord」「Microsoft Teams」
   ```

3. **複雑すぎる要件**
   - 50ノード以上は分割を推奨
   - 段階的に構築する

4. **テンプレートの記入漏れ**
   - 必須項目はすべて記入
   - 特に「Data Flow Specification」が重要

---

### Q6: 生成されたワークフローを修正したい

**A**: 複数の方法があります：

1. **Issueコメントで再生成**
   ```
   /regenerate エラーハンドリングを追加してください
   ```

2. **PRで直接編集**
   - 生成されたPRでファイルを編集
   - コミットすると自動で再検証

3. **ローカルで編集**
   ```bash
   git checkout workflow/your-workflow
   # ファイルを編集
   npm run validate workflows/your-workflow.json
   git push
   ```

---

## エラー・トラブルシューティング

### Q7: 「ANTHROPIC_API_KEY is not set」エラー

**A**: APIキーの設定を確認：

1. **GitHubシークレットの確認**
   - Settings → Secrets → ANTHROPIC_API_KEY
   - 値にスペースや改行が含まれていないか確認

2. **ローカル実行の場合**
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-xxxxx"
   # または .env ファイルに記載
   echo "ANTHROPIC_API_KEY=sk-ant-xxxxx" > .env
   ```

---

### Q8: 「Workflow validation failed」エラー

**A**: ワークフローの構造に問題があります：

1. **よくある原因**
   - ノードIDの重複
   - 存在しないノードへの接続
   - 必須パラメータの欠落

2. **デバッグ方法**
   ```bash
   # 詳細なエラーを表示
   npm run validate -- --verbose workflows/your-workflow.json
   ```

3. **自動修正**
   ```bash
   npm run fix-workflow workflows/your-workflow.json
   ```

---

### Q9: GitHub Actionsのタイムアウト

**A**: 処理時間の制限に達しています：

1. **デフォルトのタイムアウト**: 6時間
2. **ワークフロー生成の平均時間**: 1-2分
3. **タイムアウトした場合**:
   - より単純な要件に分割
   - 複雑度を下げる
   - キャッシュを活用

**タイムアウト設定の変更**:
```yaml
jobs:
  generate:
    timeout-minutes: 10  # 10分に設定
```

---

## 高度な使い方

### Q10: カスタムノードタイプを追加したい

**A**: `NODE_REGISTRY`に追加します：

```javascript
// .github/scripts/custom-nodes.js
const CUSTOM_NODES = {
  'my-custom-node': {
    version: 1,
    category: 'custom',
    parameters: {
      apiKey: { type: 'string', required: true },
      endpoint: { type: 'string', default: 'https://api.example.com' }
    }
  }
};

// enhanced-workflow-generator.js に統合
NODE_REGISTRY.custom = CUSTOM_NODES;
```

---

### Q11: 複数の環境にデプロイしたい

**A**: 環境ごとの設定を作成：

```yaml
# .github/workflows/multi-env-deploy.yml
strategy:
  matrix:
    environment: [development, staging, production]
    
steps:
  - name: Deploy to ${{ matrix.environment }}
    env:
      N8N_API_URL: ${{ secrets[format('N8N_API_URL_{0}', matrix.environment)] }}
    run: |
      npm run deploy -- --env ${{ matrix.environment }}
```

---

### Q12: ワークフローのバージョン管理

**A**: Gitのタグとブランチを活用：

```bash
# バージョンタグを作成
git tag -a v1.0.0 -m "Initial workflow version"
git push origin v1.0.0

# 特定バージョンをデプロイ
git checkout v1.0.0
npm run deploy

# ロールバック
git checkout v0.9.0
npm run deploy
```

---

## 料金・ライセンス

### Q13: このシステムの利用料金は？

**A**: システム自体は**完全無料**です：

- **本システム**: MIT License（無料）
- **必要な外部サービス**:
  - GitHub: 無料（パブリックリポジトリ）
  - Claude API: 従量課金（約$0.02-0.05/生成）
  - n8n: 無料（セルフホスト）または有料クラウド

**月間コスト目安**（100ワークフロー生成の場合）:
- Claude API: 約$2-5
- GitHub Actions: 無料（2000分/月まで）
- 合計: **約$2-5/月**

---

### Q14: 商用利用は可能ですか？

**A**: はい、可能です：

- MIT Licenseなので商用利用OK
- 改変・再配布も自由
- クレジット表記は任意（推奨）

**注意事項**:
- 生成されたワークフローの著作権はあなたのもの
- Claude APIの利用規約も確認してください

---

### Q15: サポートはありますか？

**A**: コミュニティサポートがあります：

1. **GitHub Issues**: バグ報告・機能要望
2. **Discussions**: 質問・議論
3. **Wiki**: ドキュメント・Tips
4. **Discord**: リアルタイムチャット（準備中）

**商用サポート**:
- 現在は提供していません
- エンタープライズ向けは検討中

---

## その他

### Q16: 貢献したいのですが？

**A**: 大歓迎です！

1. **コード貢献**
   ```bash
   # フォーク → 開発 → PR
   git fork
   git checkout -b feature/amazing-feature
   # 開発
   git push origin feature/amazing-feature
   # PRを作成
   ```

2. **ドキュメント改善**
   - typo修正
   - 翻訳追加
   - 例の追加

3. **バグ報告**
   - 再現手順を明記
   - エラーログを添付

4. **アイデア共有**
   - Discussionsで提案
   - Issueで機能要望

---

### Q17: 最新情報はどこで確認できますか？

**A**: 以下をチェック：

- **GitHub Releases**: 新バージョン情報
- **Changelog**: 変更履歴
- **Blog**: 開発ブログ（準備中）
- **Twitter**: @heavenlykiss0820

---

### Q18: セキュリティの懸念があります

**A**: セキュリティ対策：

1. **APIキー管理**
   - GitHubシークレットで暗号化保存
   - 環境変数経由でのみアクセス
   - ログに出力されない

2. **生成コードの安全性**
   - サニタイゼーション実施
   - インジェクション対策
   - 定期的なセキュリティ監査

3. **脆弱性報告**
   - security@example.com に報告
   - 48時間以内に対応

---

## 問題が解決しない場合

上記で解決しない場合は：

1. [GitHub Issues](https://github.com/heavenlykiss0820/n8n_CICD/issues)で質問
2. エラーログを含めて詳細に記載
3. 環境情報（OS、Node.jsバージョン等）を明記

**レスポンス目安**:
- Critical: 24時間以内
- High: 3日以内
- Normal: 1週間以内

---

💡 **Tip**: まずは[クイックスタート](QUICKSTART-jp.md)から始めることをお勧めします！