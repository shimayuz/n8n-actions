# 実装タスク

## Phase 1: 基本チャットボット実装 (1-2時間)

### ⏺ **Phase 1.1: Webhook基盤構築**
  ⎿ ☐ n8nワークフロー新規作成と基本設定
  ⎿ ☐ Webhook Triggerノード追加（POST /chatbot）
  ⎿ ☐ 認証設定（Header Auth with Bearer Token）
  ⎿ ☐ Input Validation (IF Node)実装
  ⎿ ☐ エラーレスポンス設定（400 Bad Request）

### ⏺ **Phase 1.2: LLM統合**
  ⎿ ☐ OpenAI Credentialsの設定
  ⎿ ☐ Set Nodeでシステムプロンプト設定
  ⎿ ☐ AI Agent (OpenAI Chat Model)ノード追加
  ⎿ ☐ temperature、max_tokens等のパラメータ調整
  ⎿ ☐ プロンプトテンプレート作成

### ⏺ **Phase 1.3: レスポンス処理**
  ⎿ ☐ Format Response (Set Node)でJSON整形
  ⎿ ☐ HTTP Responseノード設定
  ⎿ ☐ エンドツーエンドテスト実施
  ⎿ ☐ curl/Postmanでの動作確認
  ⎿ ☐ Phase 1ワークフローのエクスポート（バックアップ）

## Phase 2: セッション管理と会話履歴保存 (2-3時間)

### ⏺ **Phase 2.1: データベース準備**
  ⎿ ☐ PostgreSQL接続設定（Credentials）
  ⎿ ☐ conversationsテーブル作成（DDL実行）
  ⎿ ☐ インデックス作成（session_id, created_at）
  ⎿ ☐ テスト接続確認

### ⏺ **Phase 2.2: セッション管理実装**
  ⎿ ☐ Extract Session ID (Set Node)実装
  ⎿ ☐ UUID生成ロジック（Crypto Node）追加
  ⎿ ☐ Check Session History (PostgreSQL)クエリ実装
  ⎿ ☐ Merge Context (Merge Node)で履歴結合
  ⎿ ☐ Conversation Memory Buffer設定

### ⏺ **Phase 2.3: 会話保存機能**
  ⎿ ☐ Save Conversation (PostgreSQL Insert)実装
  ⎿ ☐ タイムスタンプ自動付与設定
  ⎿ ☐ Error Triggerノード追加
  ⎿ ☐ File Backup (Write Binary File)実装
  ⎿ ☐ バックアップディレクトリ作成と権限設定

### ⏺ **Phase 2.4: LLM接続改修**
  ⎿ ☐ Session Context → LLMへの接続追加
  ⎿ ☐ LLM Response → Save Conversationへの接続
  ⎿ ☐ コンテキスト長の管理（最新5件制限）
  ⎿ ☐ 統合テスト実施
  ⎿ ☐ Phase 2ワークフローのエクスポート

## Phase 3: フィードバック機能 (2-3時間)

### ⏺ **Phase 3.1: フィードバックエンドポイント**
  ⎿ ☐ Feedback Webhook Trigger追加（POST /feedback）
  ⎿ ☐ Validate Feedback (IF Node)実装
  ⎿ ☐ レーティング値検証（1 or -1）
  ⎿ ☐ conversation_id存在確認

### ⏺ **Phase 3.2: フィードバック保存**
  ⎿ ☐ feedbackテーブル作成（DDL実行）
  ⎿ ☐ Save Feedback (PostgreSQL Insert)実装
  ⎿ ☐ 外部キー制約設定（conversation_id）
  ⎿ ☐ processed フラグ管理

### ⏺ **Phase 3.3: 分析と通知**
  ⎿ ☐ Analyze Sentiment (Code Node)実装
  ⎿ ☐ 連続否定評価検出ロジック
  ⎿ ☐ Update Weights (Set Node)実装
  ⎿ ☐ Slack Credentials設定
  ⎿ ☐ Notify Admin (Slack)実装

### ⏺ **Phase 3.4: LLM重み付け統合**
  ⎿ ☐ Feedback Weights → LLMへの接続
  ⎿ ☐ 動的プロンプト調整ロジック
  ⎿ ☐ A/Bテスト実施
  ⎿ ☐ Phase 3ワークフローのエクスポート

## Phase 4: RAG実装 (3-4時間)

### ⏺ **Phase 4.1: ベクトルDB準備**
  ⎿ ☐ Pinecone/Qdrantアカウント作成
  ⎿ ☐ APIキー取得とCredentials設定
  ⎿ ☐ インデックス作成（1536次元）
  ⎿ ☐ 名前空間設定

### ⏺ **Phase 4.2: Embedding生成**
  ⎿ ☐ Extract Query (Set Node)実装
  ⎿ ☐ Generate Embedding (OpenAI)設定
  ⎿ ☐ text-embedding-3-smallモデル選択
  ⎿ ☐ ベクトル正規化処理

### ⏺ **Phase 4.3: 類似検索実装**
  ⎿ ☐ Vector Search (Pinecone)実装
  ⎿ ☐ コサイン類似度しきい値設定（0.7）
  ⎿ ☐ Retrieve Documents (PostgreSQL)実装
  ⎿ ☐ Rank Results (Code Node)でスコアリング
  ⎿ ☐ 上位5件フィルタリング

### ⏺ **Phase 4.4: RAGコンテキスト構築**
  ⎿ ☐ Build RAG Context (Set Node)実装
  ⎿ ☐ RAG Prompt Templateの作成
  ⎿ ☐ コンテキスト長管理（4000トークン制限）
  ⎿ ☐ Augmented Context → LLMへの接続

### ⏺ **Phase 4.5: Embedding Storage Sub-workflow**
  ⎿ ☐ Batch Embeddings処理実装
  ⎿ ☐ Store Vectors (Pinecone)バッチ保存
  ⎿ ☐ Update Index処理
  ⎿ ☐ 非同期処理の実装
  ⎿ ☐ Phase 4ワークフローのエクスポート

## Phase 5: 学習メカニズム (3-4時間)

### ⏺ **Phase 5.1: スケジュール設定**
  ⎿ ☐ Schedule Trigger (Cron)設定（毎日深夜2時）
  ⎿ ☐ タイムゾーン設定（JST）
  ⎿ ☐ 実行ログ設定
  ⎿ ☐ エラー通知設定

### ⏺ **Phase 5.2: データ収集**
  ⎿ ☐ Fetch Recent Conversations実装（過去24時間）
  ⎿ ☐ Fetch Feedback実装（未処理分）
  ⎿ ☐ データ結合処理
  ⎿ ☐ NULL値処理

### ⏺ **Phase 5.3: パターン分析**
  ⎿ ☐ Pattern Analysis (Code Node)実装
  ⎿ ☐ 頻出質問パターン抽出
  ⎿ ☐ 成功応答パターン識別
  ⎿ ☐ LLM Analysis (OpenAI)で深層分析
  ⎿ ☐ インサイト生成

### ⏺ **Phase 5.4: テンプレート生成と更新**
  ⎿ ☐ response_templatesテーブル作成
  ⎿ ☐ Generate Templates (Set Node)実装
  ⎿ ☐ Store Templates (PostgreSQL)保存
  ⎿ ☐ Update System Prompts実装
  ⎿ ☐ プロンプトバージョニング

### ⏺ **Phase 5.5: レポート生成**
  ⎿ ☐ Generate Report (HTML)テンプレート作成
  ⎿ ☐ メトリクス集計（会話数、満足度、応答時間）
  ⎿ ☐ グラフ生成（Chart.js）
  ⎿ ☐ Send Report (Email)設定
  ⎿ ☐ 配信リスト管理

### ⏺ **Phase 5.6: 学習ループ統合**
  ⎿ ☐ Improved Prompts → System Promptへの接続
  ⎿ ☐ フィードバックループ検証
  ⎿ ☐ A/Bテスト設定
  ⎿ ☐ Phase 5ワークフローのエクスポート

## 最終統合とテスト (2時間)

### ⏺ **統合テスト**
  ⎿ ☐ 全フェーズの結合テスト
  ⎿ ☐ エラーハンドリング検証
  ⎿ ☐ パフォーマンステスト（100リクエスト/分）
  ⎿ ☐ セキュリティ監査

### ⏺ **ドキュメント作成**
  ⎿ ☐ APIドキュメント作成
  ⎿ ☐ 運用マニュアル作成
  ⎿ ☐ トラブルシューティングガイド
  ⎿ ☐ 環境変数一覧

### ⏺ **デプロイメント準備**
  ⎿ ☐ 本番環境設定
  ⎿ ☐ 環境変数設定（.env）
  ⎿ ☐ バックアップ戦略策定
  ⎿ ☐ モニタリング設定（Grafana）
  ⎿ ☐ 最終ワークフローJSON出力

## 追加オプションタスク

### ⏺ **高度な機能**
  ⎿ ☐ マルチモーダル対応（画像入力）
  ⎿ ☐ 多言語サポート
  ⎿ ☐ カスタムモデル統合
  ⎿ ☐ Webhookセキュリティ強化（HMAC署名）
  ⎿ ☐ レート制限実装

---

**推定総実装時間**: 約13-17時間
**推奨実装順序**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
**各フェーズ完了時**: ワークフローJSONをエクスポートしてバージョン管理