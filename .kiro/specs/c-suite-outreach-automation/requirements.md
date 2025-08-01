# Requirements Document

## Introduction
本ワークフローは、LinkedInを起点としたCスイート経営幹部層向けの高度な自動アウトリーチシステムです。AIとマルチソースデータを活用し、ターゲットの痛みを特定して、パーソナライズされたマルチチャネルアプローチを実行します。これにより、質の高いリードジェネレーションと効率的な営業プロセスの自動化を実現し、ミーティング予約率の向上を目指します。

## Requirements

### Requirement 1: LinkedInリード発掘と自動ターゲティング
**User Story:** マーケティング担当者として、LinkedInから自動化のニーズを持つCスイート経営幹部を自動的に発見したい。そうすれば、質の高いリードを継続的に獲得できる。

#### Acceptance Criteria

1. WHEN 2時間ごとのスケジュールトリガーが発動した THEN システムは LinkedInスクレイピングプロセスを開始する SHALL
2. WHEN LinkedInスクレイピングが実行される THEN システムは「非効率」「手作業」「時間の無駄」「自動化が必要」などの痛みのキーワードを含む投稿を検索する SHALL
3. IF 検索結果が返される THEN システムは CEO、CTO、CDO、CTO、VP Operations の役職フィルターを適用する SHALL
4. WHERE 企業規模が従業員50〜5000人の範囲内である場合 THE SYSTEM SHALL そのリードを有効なターゲットとして保持する
5. WHEN フィルタリングが完了した THEN システムは コンサルタント、代理店、競合他社を除外する SHALL
6. IF LinkedInでのエンゲージメント（いいね、コメント、投稿頻度）が高い THEN システムは そのリードの品質スコアを上げる SHALL
7. WHILE スクレイピングプロセスが実行中 THE SYSTEM SHALL ページネーションを処理し、すべての関連する結果を取得する
8. WHEN Cスイートのマッチが見つかった THEN システムは そのリードデータを次のエンリッチメントステップに転送する SHALL

### Requirement 2: マルチソースデータエンリッチメント
**User Story:** 営業担当者として、特定されたリードの企業情報、連絡先、市場動向を自動的に収集したい。そうすれば、より効果的なアプローチが可能になる。

#### Acceptance Criteria

1. WHEN リードデータがエンリッチメントステップに到達した THEN システムは Clearbit APIを呼び出して企業の基本情報を取得する SHALL
2. IF Clearbitから企業データが返される THEN システムは 業界、規模、収益範囲、技術スタック、資金調達情報を抽出する SHALL
3. WHEN 企業情報の取得が完了した THEN システムは Hunter.io APIを使用してメールアドレスを検索する SHALL
4. IF Hunter.ioで検証済みメールが見つかった THEN システムは 到達可能性スコアと信頼度レベルを記録する SHALL
5. WHILE データエンリッチメントが進行中 THE SYSTEM SHALL Apollo.io APIを並行して呼び出し、インテントシグナルと採用トレンドを収集する
6. WHEN ZoomInfo APIが呼び出される THEN システムは 競合情報、最近の企業ニュース、市場ポジショニングデータを取得する SHALL
7. IF 業界と企業規模がマッチする THEN システムは Success Stories Databaseから関連するケーススタディを検索する SHALL
8. WHEN すべてのデータソースからの収集が完了した THEN システムは ROI計算とケーススタディのフォーマットを実行する SHALL

### Requirement 3: AI駆動のリード評価とスコアリング
**User Story:** 営業マネージャーとして、AIがリードの痛みの深さを分析し、優先順位をつけてほしい。そうすれば、最も見込みの高いリードに集中できる。

#### Acceptance Criteria

1. WHEN エンリッチされたリードデータがAI分析に送信される THEN システムは Claude/GPTモデルを使用してペインポイントを特定する SHALL
2. IF LinkedInの投稿に業務上の課題が含まれている THEN システムは その痛みの深刻度を1-10のスケールで評価する SHALL
3. WHEN 「至急」「緊急」「今四半期中」などのタイムライン指標が検出された THEN システムは 緊急度スコアを高く設定する SHALL
4. IF Cスイートレベルの意思決定権が確認された THEN システムは 予算権限スコアを最大値に設定する SHALL
5. WHILE AI分析が実行中 THE SYSTEM SHALL 企業の技術スタック、チーム規模、成長性から準備状況を評価する
6. WHEN ペインポイント分析が完了した THEN システムは 上位3つのペインポイントと提案されるn8nソリューションを生成する SHALL
7. IF リードスコアが8-10の範囲 THEN システムは そのリードを「ホット」カテゴリーに分類する SHALL
8. IF リードスコアが6-7の範囲 THEN システムは そのリードを「ウォーム」カテゴリーに分類する SHALL
9. IF リードスコアが6未満 THEN システムは そのリードを「コールド」カテゴリーに分類する SHALL

### Requirement 4: パーソナライズビデオコンテンツ生成
**User Story:** マーケティング担当者として、各リードに合わせたパーソナライズビデオを自動生成したい。そうすれば、エンゲージメント率が向上する。

#### Acceptance Criteria

1. WHEN AI Personalization Agentがリードデータを受信した THEN システムは 3つのパーソナライゼーションバリアントを決定する SHALL
2. IF ユースケース焦点バリアントが選択された THEN システムは 特定のLinkedIn投稿を引用し、関連するケーススタディをマッチングする SHALL
3. IF 業界トレンドバリアントが選択された THEN システムは 市場の自動化トレンドを引用し、競争優位性をアピールする SHALL
4. IF ROI焦点バリアントが選択された THEN システムは 定量化された時間/コスト削減を強調する SHALL
5. WHEN ビデオスクリプトが準備された THEN システムは HeyGen APIを使用して最大60秒のビデオを生成する SHALL
6. WHILE ビデオ生成中 THE SYSTEM SHALL 動的に名前と会社名を挿入し、プロフェッショナルなアバターを使用する
7. WHEN 複数のビデオバリアントが必要な場合 THEN システムは 並行してHeyGen APIを呼び出す SHALL
8. IF ビデオ生成が成功した THEN システムは ビデオURLを保存し、アウトリーチステップで使用可能にする SHALL

### Requirement 5: オムニチャネルアウトリーチの実行
**User Story:** 営業担当者として、複数のチャネルで段階的にリードにアプローチしたい。そうすれば、応答率を最大化できる。

#### Acceptance Criteria

1. WHEN Day 1のアウトリーチが開始される THEN システムは LinkedInコネクションリクエストを送信する SHALL
2. IF Day 3に到達した AND コネクションが確立されていない THEN システムは SendGrid経由でパーソナライズメールとビデオを送信する SHALL
3. WHEN Day 7に到達した AND LinkedInで繋がっている THEN システムは LinkedInメッセージを送信する SHALL
4. IF Day 10に到達した AND まだ応答がない THEN システムは ケーススタディとROI計算機を含むフォローアップを送信する SHALL
5. WHEN Day 14に到達した THEN システムは 最終フォローアップまたはリサイクルメールを送信する SHALL
6. WHILE メールが送信される THE SYSTEM SHALL 開封とクリックをトラッキングする
7. WHERE ビデオリンクが含まれる場合 THE SYSTEM SHALL 視聴完了率を記録する
8. WHEN LinkedInプロフィール訪問が検出された THEN システムは エンゲージメントスコアを更新する SHALL

### Requirement 6: パフォーマンス追跡とCRM統合
**User Story:** 営業マネージャーとして、すべてのアウトリーチ活動の結果を追跡し、CRMに自動的に同期したい。そうすれば、ROIを測定し、プロセスを最適化できる。

#### Acceptance Criteria

1. WHEN メールが開封された THEN システムは SendGrid Webhookからイベントを受信し、記録する SHALL
2. IF ビデオが視聴された THEN システムは 視聴時間と完了率を記録する SHALL
3. WHEN 返信が受信された THEN システムは 感情分析を実行し、ポジティブ/ネガティブを判定する SHALL
4. WHILE エンゲージメントデータが収集される THE SYSTEM SHALL リアルタイムでリードスコアを更新する
5. IF リードがホットまたはウォームに分類された THEN システムは HubSpot CRMに連絡先を作成または更新する SHALL
6. IF リードがコールドに分類された THEN システムは Airtableにインタラクションを記録する SHALL
7. WHEN 週次レポートの時間になった THEN システムは パフォーマンスサマリーを自動生成する SHALL
8. WHERE チャネルごとのパフォーマンスが測定される場合 THE SYSTEM SHALL メール対LinkedInの応答率を比較分析する
9. WHEN A/Bテストが実行される THEN システムは 最もパフォーマンスの高いメッセージバリアントを特定する SHALL

### Requirement 7: コンプライアンスとデータセキュリティ
**User Story:** コンプライアンス担当者として、すべてのアウトリーチ活動がGDPRに準拠し、データが安全に管理されることを確認したい。そうすれば、法的リスクを回避できる。

#### Acceptance Criteria

1. WHEN EUのプロスペクトが検出された THEN システムは GDPR準拠のオプトイン/オプトアウトメカニズムを適用する SHALL
2. IF 個人データが収集される THEN システムは 暗号化されたストレージに保存する SHALL
3. WHERE APIキーとクレデンシャルが使用される場合 THE SYSTEM SHALL 環境変数または安全なキーストアに保管する
4. WHEN データ削除リクエストが受信された THEN システムは 30日以内にすべての個人データを削除する SHALL
5. WHILE システムが稼働中 THE SYSTEM SHALL すべてのAPIコールとデータアクセスを監査ログに記録する