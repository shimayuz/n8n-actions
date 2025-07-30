# 🚀 クイックセットアップガイド

## 1. JSONファイルをn8nにインポート
```bash
# ファイルの場所
/Users/heavenlykiss0820/n8n-workflows/outputs/phase-10-11-workflow/workflow_raw.json
```

## 2. 環境変数設定（n8nの.envファイル）
```bash
EXPENSE_SHEET_ID=YOUR_GOOGLE_SHEET_ID_HERE
```

## 3. 認証情報の作成順序
1. Gmail OAuth2
2. Google Sheets OAuth2（同じGoogleアカウント）
3. Slack OAuth2
4. Gemini API Key（HTTP Query Auth）
5. Money Forward API（HTTP Bearer Token）

## 4. Google Sheetsテンプレート
以下の列名で1行目を作成：
```
申請ID｜申請者｜申請日時｜金額｜費目｜店舗名｜領収書日付｜承認状態｜承認者｜承認日時｜会計システム連携状態
```

## 5. Slack設定
- チャンネル作成: `#経費申請`, `#system-alerts`
- Webhookノードから取得したURLをSlackアプリに設定

## 6. テスト実行
1. ワークフローをActiveに
2. 件名「[経費申請] テスト」でメール送信
3. 領収書画像を添付

---
**サポート**: 問題が発生した場合は、deployment_log.mdのトラブルシューティングを参照