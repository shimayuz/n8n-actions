# Implementation Plan

- [ ] 1. プロジェクト構造とワークフロー基盤の構築
  - プロジェクトディレクトリ `projects/c-suite-outreach-automation/` を作成
  - 基本的なn8nワークフローJSONファイルを初期化（必須フィールドを含む）
  - workflow.md v2025.7に準拠した構造を確立
  - テスト用のモックデータとサンプルレスポンスを準備
  - _Requirements: 1.1_

- [ ] 2. トリガーとスケジューリングの実装
- [ ] 2.1 スケジュールトリガーノードの作成
  - Schedule Triggerノード（`n8n-nodes-base.scheduleTrigger`）を実装
  - cronExpression: `"0 */2 * * *"`（2時間ごと）を設定
  - タイムゾーンを`Asia/Tokyo`に設定
  - ワークフロー設定でエラーハンドリングを有効化
  - _Requirements: 1.1_

- [ ] 2.2 ワークフロー初期設定の実装
  - ワークフローのsettingsセクションを設定
  - `saveExecutionProgress: true`、`saveDataSuccessExecution: "all"`、`saveDataErrorExecution: "all"`を設定
  - 監査ログ用のWebhookノードを準備
  - エラー通知用のフォールバックワークフローIDを設定
  - _Requirements: 7.5_

- [ ] 3. LinkedInスクレイピングモジュールの構築
- [ ] 3.1 Airtop API統合の実装
  - HTTP Requestノード（`n8n-nodes-base.httpRequest`）でAirtop APIを設定
  - 痛みのキーワード配列をパラメータ化：["非効率", "手作業", "時間の無駄", "自動化が必要"]
  - ページネーション処理のループ構造を実装
  - APIレート制限に対応するリトライ設定（`maxTries: 3, waitBetweenTries: 2000`）
  - _Requirements: 1.2, 1.7_

- [ ] 3.2 スクレイピング結果の解析処理
  - Functionノード（`n8n-nodes-base.function`）でLinkedIn投稿データを解析
  - 役職、企業名、投稿内容、エンゲージメント指標を抽出するJavaScriptコードを実装
  - エラーハンドリングとデフォルト値の設定
  - 解析結果のデータ構造を標準化
  - _Requirements: 1.2, 1.6_

- [ ] 3.3 Cスイートフィルタリングの実装
  - IFノード（`n8n-nodes-base.if`）で役職フィルターを設定
  - 条件: `title IN ['CEO', 'CTO', 'CDO', 'VP Operations']`
  - 企業規模フィルター（従業員50〜5000人）の追加条件
  - コンサルタント、代理店、競合他社の除外ロジック
  - _Requirements: 1.3, 1.4, 1.5_

- [ ] 4. データエンリッチメントパイプラインの構築
- [ ] 4.1 並列API呼び出し構造の実装
  - Clearbit、Hunter.io、Apollo.io、ZoomInfo用のHTTP Requestノードを並列配置
  - 各APIのcredentialsをn8n Credentials Storeから参照設定
  - 共通のエラーハンドリング（`continueOnFail: true`）を全ノードに適用
  - Mergeノード（`n8n-nodes-base.merge`）でデータ統合の準備
  - _Requirements: 2.1, 2.3, 2.5, 2.6_

- [ ] 4.2 Clearbit企業情報取得の実装
  - Clearbit Enrichment APIのHTTP Requestノードを設定
  - 企業ドメインからの情報取得ロジック
  - 業界、規模、収益範囲、技術スタック、資金調達情報の抽出
  - レスポンスのnull値処理とデフォルト値設定
  - _Requirements: 2.1, 2.2_

- [ ] 4.3 Hunter.ioメール検索の実装
  - Hunter.io Domain Search APIのHTTP Requestノードを設定
  - 役職フィルターを使用した経営層メールアドレスの検索
  - 到達可能性スコアと信頼度レベルの記録
  - 複数のメール候補から最適なものを選択するロジック
  - _Requirements: 2.3, 2.4_

- [ ] 4.4 ケーススタディデータベース統合
  - Airtableノード（`n8n-nodes-base.airtable`）でケーススタディテーブルを照会
  - 業界と企業規模でのマッチングロジック
  - ROI計算用のデータ抽出とフォーマット
  - staticDataを使用した24時間キャッシング実装
  - _Requirements: 2.7, 2.8_

- [ ] 5. AI処理とスコアリングエンジンの実装
- [ ] 5.1 AI Pain Analysis ノードの設定
  - OpenAI/Claude ノード（`@n8n/n8n-nodes-langchain.openAi`）を設定
  - ペインポイント分析用のプロンプトテンプレートを実装
  - LinkedInの投稿内容と企業データを入力として構造化
  - トークン制限とコスト最適化の設定
  - _Requirements: 3.1, 3.2_

- [ ] 5.2 スコア計算ロジックの実装
  - Functionノードでスコアリングアルゴリズムを実装
  - 痛みの深刻度、予算権限、タイムライン、準備状況の4軸評価
  - 1-10スケールでの総合スコア計算
  - ホット(8-10)、ウォーム(6-7)、コールド(<6)のカテゴリ分類
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.7, 3.8, 3.9_

- [ ] 5.3 AI Personalization Agentの構築
  - AI Agentノード（`@n8n/n8n-nodes-langchain.agent`）を設定
  - 3つのパーソナライゼーションバリアント生成ロジック
  - ユースケース焦点、業界トレンド、ROI焦点の選択アルゴリズム
  - n8nソリューション提案の生成
  - _Requirements: 3.6, 4.1_

- [ ] 6. ビデオ生成とコンテンツ作成の実装
- [ ] 6.1 HeyGen API統合の設定
  - HeyGen Video APIのHTTP Requestノードを実装
  - ビデオスクリプトテンプレートの準備（3バリアント）
  - 動的な名前と会社名の挿入ロジック
  - 60秒以内のビデオ長制限の実装
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 6.2 並列ビデオ生成の実装
  - 複数のHeyGen APIノードを並列実行する構造
  - ビデオ生成の成功/失敗ハンドリング
  - ビデオURLの保存と管理
  - フォールバックとしてのテキストコンテンツ準備
  - _Requirements: 4.7, 4.8_

- [ ] 6.3 メールテンプレートビルダーの作成
  - Setノード（`n8n-nodes-base.set`）でメールテンプレートを構築
  - パーソナライズされた件名と本文の生成
  - ビデオリンクとCTAボタンの埋め込み
  - A/Bテスト用の複数バリアント作成
  - _Requirements: 5.2_

- [ ] 7. オムニチャネルアウトリーチの実装
- [ ] 7.1 14日間シーケンス制御の構築
  - Waitノード（`n8n-nodes-base.wait`）で日次タイミング制御
  - Day 1, 3, 7, 10, 14のアクションをSwitchノードで分岐
  - 各日のアクション実行状態をAirtableで追跡
  - オプトアウト処理の実装
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7.2 LinkedIn自動化の実装
  - LinkedIn Connection APIのHTTP Requestノードを設定
  - パーソナライズされた接続リクエストメッセージ
  - LinkedIn InMailメッセージの送信ロジック
  - プロフィール訪問検出とエンゲージメントスコア更新
  - _Requirements: 5.1, 5.3, 5.8_

- [ ] 7.3 SendGridメール配信の設定
  - SendGridノード（`n8n-nodes-base.sendGrid`）を設定
  - パーソナライズメールとビデオリンクの送信
  - 開封とクリックトラッキングの有効化
  - バウンスとスパム報告の処理
  - _Requirements: 5.2, 5.6_

- [ ] 8. アナリティクスとCRM統合の構築
- [ ] 8.1 SendGrid Webhookの実装
  - Webhookノード（`n8n-nodes-base.webhook`）でイベント受信
  - メール開封、クリック、返信イベントの処理
  - ビデオ視聴完了率の追跡ロジック
  - リアルタイムでのリードスコア更新
  - _Requirements: 6.1, 6.2, 6.4, 5.7_

- [ ] 8.2 感情分析とレスポンス処理
  - AIノードで返信メッセージの感情分析
  - ポジティブ/ネガティブ/ニュートラルの分類
  - 自動フォローアップのトリガー条件設定
  - エンゲージメントスコアの動的更新
  - _Requirements: 6.3, 6.4_

- [ ] 8.3 HubSpot CRM統合の実装
  - HubSpotノード（`n8n-nodes-base.hubspot`）でコンタクト管理
  - ホット/ウォームリードの自動作成と更新
  - カスタムプロパティでのスコアとカテゴリ記録
  - ディール作成とパイプライン管理
  - _Requirements: 6.5_

- [ ] 8.4 Airtableログとレポート生成
  - Airtableノード（`n8n-nodes-base.airtable`）でアクティビティログ
  - 週次パフォーマンスサマリーの自動生成
  - チャネル別応答率の比較分析
  - A/Bテスト結果の集計と最適化提案
  - _Requirements: 6.6, 6.7, 6.8, 6.9_

- [ ] 9. コンプライアンスとセキュリティの実装
- [ ] 9.1 GDPR準拠メカニズムの構築
  - IFノードでEUプロスペクトの検出ロジック
  - オプトイン/オプトアウトフローの実装
  - 同意管理とトラッキングの設定
  - データ保持期間の自動管理
  - _Requirements: 7.1_

- [ ] 9.2 データセキュリティとクレデンシャル管理
  - すべてのAPIキーをn8n Credentials Storeに移行
  - 環境変数での追加セキュリティ設定
  - 個人データの暗号化フィールド設定
  - APIコールの監査ログ実装
  - _Requirements: 7.2, 7.3, 7.5_

- [ ] 9.3 データ削除ワークフローの作成
  - 30日後の自動データ削除スケジュール
  - 手動削除リクエストの処理フロー
  - 削除確認と監査証跡の生成
  - CRMとの同期削除メカニズム
  - _Requirements: 7.4_

- [ ] 10. 統合テストと最終調整
- [ ] 10.1 エンドツーエンドワークフローテスト
  - 完全なリード処理フローのテスト実行
  - 各APIのモックモードでの動作確認
  - エラーシナリオとフォールバックのテスト
  - パフォーマンス目標（5分以内の実行）の検証
  - _Requirements: 全体_

- [ ] 10.2 ワークフロー品質保証と最適化
  - workflow.md v2025.7準拠の最終チェック
  - 全ノードのnotes/Sticky Noteへの日本語説明追加
  - 不要な接続やノードの削除
  - 実行ログとデバッグ情報の最適化
  - _Requirements: 全体_