# Requirements Document

## Introduction

本ワークフローは、LINE Messaging APIとGoogle Gemini AIを統合し、マルチモーダルなAI機能を提供するn8nワークフローです。ユーザーはLINEを通じて、テキストチャット、画像生成、音声文字起こしといったAI機能を簡単に利用できるようになります。これにより、LINEプラットフォーム上で高度なAIサービスを手軽に提供し、ユーザーエクスペリエンスを大幅に向上させることができます。

## Requirements

### Requirement 1: LINE Webhook受信と処理
**User Story:** LINEユーザーとして、メッセージを送信した際に、適切にWebhookが受信・処理されることを期待する

#### Acceptance Criteria

1. WHEN LINEからWebhookリクエストが送信される THEN n8nワークフローは正常にリクエストを受信し処理を開始する
2. IF Webhookリクエストのヘッダーに`X-Line-Signature`が含まれている THEN システムは署名を検証し、正当なリクエストのみを処理する
3. WHEN 不正な署名のリクエストが受信される THEN システムは401エラーを返却し、処理を中断する
4. WHILE Webhookを処理中 THE SYSTEM SHALL 30秒以内にLINEへ200レスポンスを返却する
5. IF リクエストボディが不正な形式 THEN システムは400エラーを返却し、エラーログを記録する

### Requirement 2: メッセージタイプの識別と振り分け
**User Story:** LINEユーザーとして、送信したメッセージの種類（テキスト、画像、音声）に応じて適切なAI機能が実行されることを期待する

#### Acceptance Criteria

1. WHEN テキストメッセージが受信される THEN システムはメッセージをテキストチャット処理フローへ振り分ける
2. WHEN 画像メッセージが受信される THEN システムはメッセージを画像生成処理フローへ振り分ける
3. WHEN 音声メッセージが受信される THEN システムはメッセージを音声文字起こし処理フローへ振り分ける
4. IF サポート外のメッセージタイプ（スタンプ、位置情報等）が受信される THEN システムは「このメッセージタイプはサポートされていません」というメッセージをLINEに返信する
5. WHERE 複数のメッセージが同時に送信された場合 THE SYSTEM SHALL 各メッセージを個別に処理する

### Requirement 3: Gemini AIテキストチャット機能
**User Story:** LINEユーザーとして、テキストメッセージを送信すると、Gemini AIによる自然な対話応答を受け取りたい

#### Acceptance Criteria

1. WHEN テキストメッセージが識別される THEN システムはGemini Native Nodeを使用してテキスト生成APIを呼び出す
2. IF Gemini APIが正常に応答する THEN システムは生成されたテキストをLINEユーザーに返信する
3. WHEN Gemini APIのレスポンスが2000文字を超える THEN システムは適切に分割してLINEメッセージとして送信する
4. IF Gemini APIがエラーを返す THEN システムは「申し訳ございません。現在AIサービスが利用できません」というメッセージを返信する
5. WHILE Gemini APIを呼び出し中 THE SYSTEM SHALL タイムアウトを30秒に設定し、超過時はエラーメッセージを返信する

### Requirement 4: Gemini AI画像生成機能
**User Story:** LINEユーザーとして、テキストで画像の説明を送信すると、Gemini AIが生成した画像を受け取りたい

#### Acceptance Criteria

1. WHEN 「画像生成:」で始まるテキストメッセージが受信される THEN システムは画像生成リクエストとして処理する
2. IF 画像生成プロンプトが適切 THEN システムはGemini Native Nodeを使用して画像生成APIを呼び出す
3. WHEN Gemini AIが画像を生成する THEN システムは生成された画像をLINEの画像メッセージとして返信する
4. IF 画像生成に失敗する THEN システムは「画像の生成に失敗しました。別の説明をお試しください」というメッセージを返信する
5. WHERE 不適切なコンテンツのリクエスト THE SYSTEM SHALL 「このリクエストは処理できません」というメッセージを返信する

### Requirement 5: Gemini AI音声文字起こし機能
**User Story:** LINEユーザーとして、音声メッセージを送信すると、Gemini AIが文字起こしした内容を受け取りたい

#### Acceptance Criteria

1. WHEN 音声メッセージが受信される THEN システムは音声ファイルをダウンロードしGemini APIへ送信する準備をする
2. IF 音声ファイルのダウンロードが成功する THEN システムはGemini Native Nodeを使用して音声文字起こしAPIを呼び出す
3. WHEN Gemini AIが音声を文字起こしする THEN システムは「文字起こし結果:\n[文字起こし内容]」という形式でLINEに返信する
4. IF 音声ファイルが5MB以上 THEN システムは「音声ファイルが大きすぎます。5MB以下のファイルを送信してください」というメッセージを返信する
5. WHERE 音声形式がサポート外（M4A以外） THE SYSTEM SHALL 形式変換を試み、失敗時は「サポートされていない音声形式です」と返信する

### Requirement 6: エラーハンドリングとロギング
**User Story:** システム管理者として、エラーが発生した際の適切な処理とログ記録により、問題の特定と解決を迅速に行いたい

#### Acceptance Criteria

1. WHEN 任意のノードでエラーが発生する THEN システムはエラー内容をログに記録し、ユーザーには一般的なエラーメッセージを返信する
2. IF LINE APIへの返信が失敗する THEN システムは3回までリトライを実行し、すべて失敗時はエラーログに詳細を記録する
3. WHILE エラーが連続して発生している THE SYSTEM SHALL サーキットブレーカーパターンを適用し、一時的にサービスを停止する
4. WHERE APIキーやトークンの認証エラー THE SYSTEM SHALL 管理者へアラート通知を送信する
5. WHEN 処理が正常に完了する THEN システムは処理時間とリクエスト内容をアクセスログに記録する

### Requirement 7: パフォーマンスと制限
**User Story:** LINEユーザーとして、快適なレスポンス速度でAI機能を利用し、システムの安定性が保たれることを期待する

#### Acceptance Criteria

1. WHEN 通常のテキストチャット処理 THEN システムは5秒以内にLINEへ返信を完了する
2. IF 同時に10件以上のリクエストが受信される THEN システムはキューイングして順次処理を実行する
3. WHERE 特定ユーザーから1分間に10回以上のリクエスト THE SYSTEM SHALL レート制限を適用し「しばらくお待ちください」と返信する
4. WHEN システムリソースの使用率が80%を超える THEN システムは新規リクエストの受付を一時停止する
5. WHILE 画像生成や音声処理中 THE SYSTEM SHALL プログレスインジケーターまたは「処理中」メッセージをユーザーに表示する