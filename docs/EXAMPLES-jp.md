# 📚 ワークフロー生成の実例集

実際に生成できるn8nワークフローの具体例を、カテゴリ別に紹介します。

## 目次

1. [基本的なワークフロー](#基本的なワークフロー)
2. [AI・機械学習](#ai機械学習)
3. [データ処理](#データ処理)
4. [コミュニケーション](#コミュニケーション)
5. [自動化・効率化](#自動化効率化)
6. [ECサイト・ビジネス](#ecサイトビジネス)
7. [開発者向け](#開発者向け)

---

## 基本的なワークフロー

### 1. Hello World

最もシンプルなワークフロー。動作確認に最適。

```markdown
### Workflow Name
hello-world

### Workflow Description
Webhookを受信して「Hello World」を返すシンプルなワークフロー

### Trigger Type
Webhook

### Data Flow Specification
1. POSTリクエストを受信
2. "Hello World"メッセージを追加
3. JSONレスポンスを返す
```

**生成されるノード**: Webhook → Set → Respond to Webhook

---

### 2. スケジュール実行

定期的にタスクを実行する基本パターン。

```markdown
### Workflow Name
daily-backup

### Workflow Description
毎日深夜2時にデータベースをバックアップ

### Trigger Type
Schedule/Cron

### Data Flow Specification
1. 毎日AM2:00に起動
2. データベースをエクスポート
3. Google Driveに保存
4. 完了通知をSlackに送信
```

**生成されるノード**: Schedule Trigger → PostgreSQL → Google Drive → Slack

---

## AI・機械学習

### 3. AIチャットボット（Discord）

GPT-4を使用した高機能チャットボット。

```markdown
### Workflow Name
discord-ai-assistant

### Workflow Description
DiscordでGPT-4を使った質問応答ボット。会話履歴を保持し、文脈を理解した返答が可能。

### Trigger Type
Webhook

### Required Integrations
- Discord（メッセージ送受信）
- OpenAI GPT-4（AI処理）
- PostgreSQL（会話履歴保存）

### Data Flow Specification
1. Discordからメッセージを受信
2. ユーザーIDで過去の会話履歴を取得
3. GPT-4にコンテキスト付きで質問
4. 返答をDiscordに送信
5. 会話履歴をDBに保存

### Required Features
[x] Error Handling
[x] Rate Limiting
[x] Logging/Audit Trail
```

**生成されるノード**: Discord Trigger → PostgreSQL (Read) → GPT-4 Agent → Discord (Send) → PostgreSQL (Write)

---

### 4. 画像認識ワークフロー

画像を分析してタグ付けや分類を行う。

```markdown
### Workflow Name
image-analysis-pipeline

### Workflow Description
アップロードされた画像を分析し、内容を説明するテキストを生成。商品画像の自動タグ付けに使用。

### Trigger Type
Webhook

### Required Integrations
- OpenAI Vision API（画像分析）
- Google Cloud Storage（画像保存）
- PostgreSQL（メタデータ保存）

### Data Flow Specification
1. 画像ファイルをWebhookで受信
2. Google Cloud Storageに保存
3. Vision APIで画像を分析
4. タグとキャプションを生成
5. メタデータをDBに保存
6. 結果をJSONで返す
```

**生成されるノード**: Webhook → GCS Upload → Vision API → Set Data → PostgreSQL → Respond

---

### 5. 感情分析システム

カスタマーレビューの感情を自動分析。

```markdown
### Workflow Name
sentiment-analyzer

### Workflow Description
顧客レビューをリアルタイムで感情分析し、ネガティブな内容は即座にカスタマーサポートに通知

### Trigger Type
Database Change

### Required Integrations
- PostgreSQL（レビュー監視）
- OpenAI（感情分析）
- Slack（通知）
- SendGrid（メール）

### Data Flow Specification
1. 新しいレビューをデータベースで検知
2. OpenAIで感情スコアを計算（-1.0〜1.0）
3. スコアが-0.5以下の場合：
   - Slackの緊急チャンネルに通知
   - 担当者にメール送信
4. 全レビューの感情スコアをDBに記録
```

**生成されるノード**: PostgreSQL Trigger → OpenAI → IF (Score Check) → Slack/SendGrid → PostgreSQL Update

---

## データ処理

### 6. ETLパイプライン

複数のソースからデータを統合。

```markdown
### Workflow Name
sales-data-etl

### Workflow Description
複数のECプラットフォームから売上データを収集し、統合レポートを作成

### Trigger Type
Schedule/Cron

### Required Integrations
- Shopify API（売上データ）
- Amazon MWS（売上データ）
- Google Sheets（レポート出力）
- BigQuery（データウェアハウス）

### Data Flow Specification
1. 毎日午前6時に実行
2. Shopifyから前日の売上を取得
3. Amazon MWSから前日の売上を取得
4. データを正規化・統合
5. BigQueryにロード
6. 集計レポートをGoogle Sheetsに出力
7. 完了通知をSlackに送信

### Required Features
[x] Error Handling
[x] Retry Logic
[x] Data Validation
[x] Logging/Audit Trail
```

**生成されるノード**: Schedule → Shopify/Amazon (Parallel) → Merge → Transform → BigQuery → Google Sheets → Slack

---

### 7. CSVバッチ処理

大量のCSVファイルを効率的に処理。

```markdown
### Workflow Name
csv-batch-processor

### Workflow Description
FTPサーバーから毎時CSVファイルを取得し、データをクレンジング後、データベースに一括登録

### Trigger Type
Schedule/Cron

### Required Integrations
- FTP（ファイル取得）
- PostgreSQL（データ保存）
- S3（アーカイブ）

### Data Flow Specification
1. 毎時0分に実行
2. FTPから新しいCSVファイルを取得
3. データ検証（必須フィールド、型チェック）
4. 重複データを除外
5. 1000件ずつバッチでDBに挿入
6. 処理済みファイルをS3にアーカイブ
7. 処理結果をメールで報告
```

**生成されるノード**: Schedule → FTP → Read CSV → Validate → Split Batch → PostgreSQL → S3 → Email

---

## コミュニケーション

### 8. マルチチャンネル通知

複数のチャンネルに同時通知。

```markdown
### Workflow Name
multi-channel-alert

### Workflow Description
重要なイベントを複数のチャンネル（Slack、Discord、Email、SMS）に同時通知

### Trigger Type
Webhook

### Required Integrations
- Slack
- Discord
- SendGrid（Email）
- Twilio（SMS）

### Data Flow Specification
1. アラートをWebhookで受信
2. 優先度を判定（High/Medium/Low）
3. Highの場合：全チャンネルに通知
4. Mediumの場合：SlackとEmailのみ
5. Lowの場合：Slackのみ
6. 通知履歴をログに記録
```

**生成されるノード**: Webhook → Switch (Priority) → Parallel Notifications → Log

---

### 9. カスタマーサポート自動化

問い合わせを自動分類・回答。

```markdown
### Workflow Name
customer-support-automation

### Workflow Description
メールで受信した問い合わせを自動分類し、FAQで回答可能なものは自動返信、複雑な質問は担当者に振り分け

### Trigger Type
Email

### Required Integrations
- Gmail（メール受信）
- OpenAI（内容分析）
- Zendesk（チケット作成）
- PostgreSQL（FAQ検索）

### Data Flow Specification
1. 新着メールを監視
2. OpenAIで問い合わせ内容を分析
3. カテゴリを判定（技術/請求/一般）
4. FAQデータベースを検索
5. 該当するFAQがあれば自動返信
6. なければZendeskチケット作成
7. 担当者にSlack通知
```

**生成されるノード**: Email Trigger → OpenAI → PostgreSQL Search → IF (FAQ Found) → Email/Zendesk → Slack

---

## 自動化・効率化

### 10. SNS自動投稿

複数のSNSに同時投稿。

```markdown
### Workflow Name
social-media-scheduler

### Workflow Description
ブログ記事が公開されたら、自動的にTwitter、Facebook、LinkedInに投稿

### Trigger Type
Webhook

### Required Integrations
- WordPress（記事検知）
- Twitter API
- Facebook API
- LinkedIn API
- Bitly（URL短縮）

### Data Flow Specification
1. WordPress新記事公開を検知
2. 記事タイトルと要約を取得
3. BitlyでURLを短縮
4. 各SNS用にメッセージを最適化
5. 予約時間に合わせて投稿
6. 投稿結果をダッシュボードに記録
```

**生成されるノード**: WordPress Webhook → Bitly → Format Messages → Parallel SNS Posts → Dashboard Update

---

### 11. 請求書自動処理

請求書の受信から支払いまで自動化。

```markdown
### Workflow Name
invoice-processor

### Workflow Description
メールで受信した請求書PDFを自動的に処理し、承認フローを実行後、経理システムに登録

### Trigger Type
Email

### Required Integrations
- Gmail（請求書受信）
- Google Drive（PDF保存）
- OCR API（テキスト抽出）
- Slack（承認依頼）
- 会計システムAPI

### Data Flow Specification
1. 請求書メールを受信
2. PDFをGoogle Driveに保存
3. OCRで請求内容を抽出
4. 金額が10万円以上なら承認フロー
5. Slackで承認依頼
6. 承認後、会計システムに登録
7. 処理完了を送信者に通知
```

**生成されるノード**: Email → Drive Save → OCR → IF (Amount) → Slack Approval → Accounting API → Email Reply

---

## ECサイト・ビジネス

### 12. 在庫管理システム

リアルタイム在庫同期。

```markdown
### Workflow Name
inventory-sync

### Workflow Description
複数の販売チャンネル（実店舗、ECサイト、Amazon）の在庫をリアルタイムで同期

### Trigger Type
Database Change

### Required Integrations
- POS System API（実店舗）
- Shopify（ECサイト）
- Amazon MWS
- PostgreSQL（在庫マスター）

### Data Flow Specification
1. いずれかのチャンネルで在庫変動を検知
2. 在庫マスターDBを更新
3. 他の全チャンネルに変更を反映
4. 在庫が5個以下になったら発注アラート
5. 在庫切れの場合、全チャンネルで販売停止
6. 変動履歴をログに記録
```

**生成されるノード**: DB Trigger → Update Master → Parallel Channel Updates → IF (Low Stock) → Alert/Stop Sales → Log

---

### 13. 注文フルフィルメント

注文から配送まで完全自動化。

```markdown
### Workflow Name
order-fulfillment

### Workflow Description
注文受注から配送手配、顧客通知まで完全自動化

### Trigger Type
Webhook

### Required Integrations
- Shopify（注文受信）
- 在庫管理システム
- 配送業者API
- SendGrid（顧客通知）
- Slack（スタッフ通知）

### Data Flow Specification
1. 新規注文を受信
2. 在庫を確認・確保
3. 配送ラベルを生成
4. 倉庫に出荷指示
5. 顧客に注文確認メール
6. 配送業者に集荷依頼
7. 追跡番号を顧客に送信
8. スタッフにSlack通知
```

**生成されるノード**: Order Webhook → Inventory Check → Shipping Label → WMS → Emails → Carrier API → Slack

---

## 開発者向け

### 14. CI/CDパイプライン通知

ビルド結果を関係者に通知。

```markdown
### Workflow Name
cicd-notifier

### Workflow Description
GitHub ActionsのビルドやデプロイのステータスをSlackとメールで通知

### Trigger Type
Webhook

### Required Integrations
- GitHub Webhook
- Slack
- SendGrid
- Jira（チケット更新）

### Data Flow Specification
1. GitHub Actionsからwebhookを受信
2. ビルドステータスを解析
3. 失敗の場合：
   - 開発チームのSlackに詳細通知
   - 責任者にメール
   - Jiraチケットを作成
4. 成功の場合：
   - プロジェクトSlackに簡潔通知
   - デプロイログを記録
```

**生成されるノード**: GitHub Webhook → Parse Status → Switch → Slack/Email/Jira → Log

---

### 15. エラー監視・対応

アプリケーションエラーを自動対応。

```markdown
### Workflow Name
error-monitoring

### Workflow Description
Sentryからエラーを受信し、重要度に応じて自動対応

### Trigger Type
Webhook

### Required Integrations
- Sentry（エラー検知）
- PagerDuty（緊急通知）
- GitHub（Issue作成）
- Slack
- CloudWatch（メトリクス）

### Data Flow Specification
1. Sentryからエラー通知を受信
2. エラーレートを計算
3. Critical（1分間に10件以上）：
   - PagerDutyで緊急呼び出し
   - 全チームSlackに通知
   - 自動ロールバック検討
4. High（1分間に5件）：
   - GitHub Issueを自動作成
   - 開発Slackに通知
5. CloudWatchにメトリクス送信
```

**生成されるノード**: Sentry Webhook → Calculate Rate → Switch (Severity) → PagerDuty/GitHub/Slack → CloudWatch

---

## 生成のコツ

### 詳細な要件の書き方

より良いワークフローを生成するために：

1. **具体的な数値を含める**
   ```
   - 10万件以上のデータを処理
   - 5秒以内にレスポンス
   - 99.9%の可用性
   ```

2. **エラー処理を明記**
   ```
   - API失敗時：3回リトライ後、フォールバック処理
   - データ不整合：管理者に通知してスキップ
   ```

3. **パフォーマンス要件**
   ```
   - バッチサイズ：1000件
   - 並列処理：最大5スレッド
   - タイムアウト：30秒
   ```

### テンプレートの活用

よく使うパターンはテンプレート化：

```yaml
# templates/api-integration.yaml
base_nodes:
  - webhook_trigger
  - authentication
  - rate_limiter
  - api_call
  - error_handler
  - response

common_features:
  - retry_with_backoff
  - circuit_breaker
  - logging
  - monitoring
```

---

これらの例を参考に、あなたのビジネスニーズに合わせたワークフローを自動生成してみてください！