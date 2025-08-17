# 🚀 クイックスタートガイド

## 5分で始めるn8n AI自動生成

このガイドでは、最短5分でn8nワークフローの自動生成を始める方法を説明します。

## 📝 必要なもの

- GitHubアカウント
- Anthropic APIキー（[無料トライアルあり](https://console.anthropic.com/)）

## 🎯 3ステップセットアップ

### ステップ1: リポジトリをフォーク

1. [このリポジトリ](https://github.com/heavenlykiss0820/n8n_CICD)にアクセス
2. 右上の**Fork**ボタンをクリック
3. 自分のアカウントにフォーク

### ステップ2: APIキーを設定

1. フォークしたリポジトリの**Settings**タブを開く
2. 左メニューから**Secrets and variables** → **Actions**を選択
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

## ⏱️ 生成を確認

1. Issueにコメントが追加されるのを待つ（約1-2分）
2. 「✅ Workflow Successfully Generated!」が表示されたら成功
3. 作成されたPull Requestのリンクをクリック
4. 生成されたワークフローを確認

## 🎉 完了！

おめでとうございます！最初のワークフローが自動生成されました。

## 📚 次のステップ

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

#### 例2: AI チャットボット

```markdown
### Workflow Name
ai-chatbot-workflow

### Workflow Description
GPT-4を使用したインテリジェントなチャットボット

### Trigger Type
Webhook

### Required Integrations
- OpenAI GPT-4（AI処理）
- Discord（メッセージ送受信）

### Data Flow Specification
1. Discordからメッセージを受信
2. GPT-4で返答を生成
3. Discordに返信
```

## 💡 便利なTips

### Tip 1: コマンドを使う

Issueのコメントで以下が使えます：

```
/regenerate  # ワークフローを再生成
/validate    # 検証を実行
/test        # テストを実行
```

### Tip 2: 複雑な要件の書き方

より詳細な指示を与えることで、精度が向上します：

```markdown
### Required Features
[x] Error Handling
[x] Retry Logic
[x] Rate Limiting
[x] Logging/Audit Trail

### Error Handling Requirements
- API失敗時: 3回リトライ
- タイムアウト: 30秒で中断
- エラー時: 管理者にメール通知
```

### Tip 3: テストデータの提供

テストデータを含めると、より正確なワークフローが生成されます：

```json
{
  "test_data": {
    "input": {
      "user_id": "12345",
      "action": "subscribe",
      "email": "test@example.com"
    },
    "expected_output": {
      "status": "success",
      "message": "Subscription created"
    }
  }
}
```

## 🔧 トラブルシューティング

### Q: ワークフローが生成されない

**A**: 以下を確認してください：
- APIキーが正しく設定されているか
- Issueテンプレートの必須項目が記入されているか
- GitHub Actionsが有効になっているか

### Q: 生成されたワークフローにエラーがある

**A**: コメントで `/regenerate` と入力して再生成してください。

### Q: もっと複雑なワークフローを作りたい

**A**: `Workflow Complexity` を `Complex` または `Very Complex` に設定してください。

## 📖 詳細ドキュメント

- [完全なセットアップガイド](../README-jp.md)
- [高度な設定](../docs/n8n-workflow-docs/advanced-configuration.md)
- [APIリファレンス](../docs/n8n-workflow-docs/ai-compiler-reference.md)

## 🆘 ヘルプ

問題が解決しない場合：

1. [GitHub Issues](https://github.com/heavenlykiss0820/n8n_CICD/issues)で質問
2. [Discussions](https://github.com/heavenlykiss0820/n8n_CICD/discussions)で相談
3. ドキュメントの[FAQ](#)を確認

---

**準備完了！** これでn8nワークフローの自動生成が使えるようになりました。🎊