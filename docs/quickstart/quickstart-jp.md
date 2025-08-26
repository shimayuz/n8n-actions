# クイックスタートガイド

## 5分で始めるn8n Actions

このガイドでは、5分以内に初めてのn8nワークフローを自動生成する方法を説明します。

## 必要なもの

- GitHubアカウント
- Anthropic APIキー（[無料トライアルあり](https://console.anthropic.com/)）

## 3ステップセットアップ

### ステップ1: リポジトリをフォーク

1. [このリポジトリ](https://github.com/your-org/n8n-actions)にアクセス
2. 右上の**Fork**ボタンをクリック
3. 自分のアカウントにフォーク

### ステップ2: APIキーを設定

1. フォークしたリポジトリの**Settings**タブを開く
2. **Secrets and variables** → **Actions**に移動
3. **New repository secret**をクリック
4. 以下を追加：
   - Name: `ANTHROPIC_API_KEY`
   - Secret: あなたのClaude APIキー

### ステップ3: 最初のワークフローを生成

1. **Issues**タブを開く
2. **New issue**をクリック
3. **n8n Workflow Request**テンプレートを選択
4. 以下のサンプルを貼り付け：

```markdown
### Workflow Name
hello-world-workflow

### Workflow Description
Webhookを受信してメッセージを返すシンプルなワークフロー

### Trigger Type
Webhook

### Required Integrations
なし（基本機能のみ）

### Data Flow Specification
1. Webhookでデータを受信
2. メッセージを加工
3. レスポンスを返す

### Success Criteria
- Webhookが正常に動作する
- レスポンスが返される
```

5. **Submit new issue**をクリック

## 生成を確認

1. Issueにコメントが追加されるのを待つ（約1-2分）
2. 「✅ Workflow Successfully Generated!」が表示されたら成功
3. 作成されたPull Requestのリンクをクリック
4. 生成されたワークフローを確認

## 完了！

おめでとうございます！最初のワークフローが自動生成されました。

## 次のステップ

### 実践的なワークフローを作る

#### 例1: Slack通知ワークフロー

```markdown
### Workflow Name
slack-notification-workflow

### Workflow Description
特定の条件でSlackに通知を送るワークフロー

### Trigger Type
Schedule/Cron

### Required Integrations
- Slack（通知送信）

### Data Flow Specification
1. 毎朝9時に起動
2. データを取得
3. Slackに日報を送信
```

#### 例2: AIチャットボット

```markdown
### Workflow Name
ai-chatbot-workflow

### Workflow Description
OpenAIを使用して質問に答えるAIチャットボット

### Trigger Type
Webhook

### Required Integrations
- OpenAI（AI応答用）
- SlackまたはDiscord（メッセージング用）

### Data Flow Specification
1. Webhookでメッセージを受信
2. OpenAIで処理
3. AI応答を返す
```

## 高度な機能

### 既存ワークフローをテンプレートとして使用

1. `workflows/`ディレクトリにワークフローファイルを配置
2. Issueで参照：

```markdown
### Base Workflow
workflows/template.workflow.jsonをベースとして使用

### Modifications
- エラーハンドリングを追加
- リトライロジックを含める
- ログを追加
```

### ワークフロー修正

生成されたワークフローに問題がある場合：

1. **Workflow Bug**テンプレートでIssueを作成
2. ワークフローファイルとエラーを指定
3. システムが自動的に修正

## ヒントとベストプラクティス

### 1. 明確な指示
- データフローを具体的に
- 必要なノードをすべて含める
- エラーハンドリングの要件を指定

### 2. テンプレートを使用
- シンプルなワークフローから開始
- 段階的に複雑性を構築
- 成功したパターンを再利用

### 3. テスト
- 本番前に必ずn8nでテスト
- すべての接続を検証
- エラーハンドリングを確認

## 一般的なパターン

### データ処理パイプライン
```markdown
Webhook → 検証 → 変換 → 保存 → 通知
```

### スケジュールレポート
```markdown
スケジュール → データ取得 → レポート生成 → メール送信
```

### AI統合
```markdown
入力 → AI処理 → 決定 → アクション
```

## トラブルシューティング

| 問題 | 解決方法 |
|------|----------|
| ワークフローが生成されない | APIキー設定を確認 |
| 無効なJSON | PRコメントでエラーを確認 |
| ノードエラー | 正確なノードバージョンを指定 |
| 接続問題 | ノードの互換性を確認 |

## ヘルプを得る

- [ドキュメント](../README.md)を確認
- [例](../references/examples-jp.md)を確認
- 質問があればIssueを開く

## リソース

- [n8nドキュメント](https://docs.n8n.io)
- [n8nノードリファレンス](https://docs.n8n.io/nodes/)
- [Claude APIドキュメント](https://docs.anthropic.com)

---

*自動化の準備はできましたか？今すぐワークフローを作成しましょう！*