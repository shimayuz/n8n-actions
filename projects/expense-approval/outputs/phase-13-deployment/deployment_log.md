# 📊 デプロイメントログ

## 実行日時
2025-01-13T08:20:50Z

## デプロイ方法
n8n APIを使用したワークフロー作成を試みましたが、API仕様の確認が必要なため、代替手段として手動インポート用のファイルを準備しました。

## 準備済みファイル
- **ワークフローJSON**: `/Users/heavenlykiss0820/n8n-workflows/workflows/expense-approval-workflow.json`
- **APIレスポンス用**: `/Users/heavenlykiss0820/n8n-workflows/workflows/expense-approval-api.json`

## n8n APIについて
mcp.jsonに設定されているAPIエンドポイント:
- **URL**: https://n8n.composition2940.com/api/v1
- **API Key**: 設定済み（JWT形式）

## 手動デプロイ手順
1. n8nダッシュボードにログイン
2. 左メニューから「Workflows」を選択
3. 右上の「Import from File」をクリック
4. `/Users/heavenlykiss0820/n8n-workflows/workflows/expense-approval-workflow.json`を選択
5. インポート完了後、各ノードの認証情報を設定

## 必要な認証情報
1. **Gmail OAuth2** - メール受信用
2. **Google Sheets OAuth2** - データ保存用
3. **Slack OAuth2** - 通知・承認用
4. **Gemini API Key** - OCR処理用
5. **Money Forward API** - 会計システム連携用

## 環境変数
```bash
EXPENSE_SHEET_ID=YOUR_GOOGLE_SHEET_ID_HERE
```

## 次のステップ
1. 上記の手動インポート手順に従ってワークフローをインポート
2. 各サービスの認証情報を設定
3. Google Sheetsを作成し、IDを環境変数に設定
4. Slackチャンネル（#経費申請、#system-alerts）を作成
5. ワークフローをアクティブ化してテスト実行

## トラブルシューティング
- **認証エラー**: 各サービスのOAuth設定を確認
- **Webhook URL**: ワークフロー保存後に生成されるWebhook URLをSlackアプリに設定
- **権限エラー**: Google SheetsとGmailが同じGoogleアカウントであることを確認