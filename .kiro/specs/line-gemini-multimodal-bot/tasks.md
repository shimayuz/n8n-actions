# Implementation Plan

- [ ] 1. 基本ワークフロー構造とWebhook受信の実装
- [ ] 1.1 n8nワークフローの初期構造を作成
  - n8nエディタで新規ワークフローを作成し、"LINE Gemini Multimodal Bot"という名前を設定
  - workflow.mdのガイドラインに従い、必須フィールド（name, nodes, connections, versionId, active, settings）を含むJSON構造を確認
  - Webhookノード（n8n-nodes-base.webhook v2）を追加し、path: "line-gemini-bot", httpMethod: "POST", responseMode: "responseNode"に設定
  - _Requirements: 1.1_

- [ ] 1.2 署名検証Functionノードの実装
  - Functionノード（n8n-nodes-base.function v1）を追加し、"署名検証"という名前を設定
  - HMAC-SHA256アルゴリズムを使用したLINE署名検証コードを実装（design.mdの署名検証コードを参照）
  - 検証失敗時にInvalidSignatureエラーをthrowし、成功時はボディデータを次のノードに渡す処理を実装
  - continueOnFail: falseに設定して、署名検証失敗時はワークフローを停止
  - _Requirements: 1.2, 1.3_

- [ ] 1.3 リクエスト解析とWebhook応答の基本実装
  - Setノード（n8n-nodes-base.set v3）を追加し、"リクエスト解析"という名前を設定
  - Webhookボディからevents配列を抽出し、最初のイベントのデータ（message.type, replyToken, userId）を個別フィールドとして設定
  - Respond to Webhookノード（n8n-nodes-base.respondToWebhook v1）を追加し、responseCode: 200を設定
  - Webhook → 署名検証 → リクエスト解析 → Respond の基本フローを接続
  - _Requirements: 1.4, 1.5_

- [ ] 2. メッセージタイプ判定と振り分けロジックの実装
- [ ] 2.1 メッセージタイプ判定IFノードの実装
  - IFノード（n8n-nodes-base.if v3）を追加し、"メッセージタイプ判定"という名前を設定
  - 条件1: message.type === "text" の判定を実装
  - 条件2: message.type === "audio" の判定を実装
  - デフォルト出力をサポート外メッセージ処理に接続する設定
  - _Requirements: 2.1, 2.3_

- [ ] 2.2 画像生成リクエスト判定の実装
  - テキストメッセージ分岐後にIFノード（n8n-nodes-base.if v3）を追加し、"画像生成判定"という名前を設定
  - テキストが"画像生成:"で始まるかを判定する条件式を実装: {{ $json.text.startsWith('画像生成:') }}
  - True分岐を画像生成フロー、False分岐をテキストチャットフローに接続する準備
  - _Requirements: 2.1, 4.1_

- [ ] 2.3 サポート外メッセージ処理の実装
  - Setノード（n8n-nodes-base.set v3）を追加し、"サポート外メッセージ"という名前を設定
  - エラーメッセージ「このメッセージタイプはサポートされていません」を設定
  - メッセージタイプ判定のデフォルト出力から接続
  - _Requirements: 2.4_

- [ ] 3. Geminiテキストチャット機能の実装
- [ ] 3.1 Gemini Text Nodeの設定と基本実装
  - Google Geminiノード（@n8n/n8n-nodes-langchain.googleGemini v1）を追加し、"Geminiテキスト処理"という名前を設定
  - resource: "text", operation: "message"に設定
  - modelId: "gemini-2.5-pro"を設定（design.mdの仕様に基づく）
  - プロンプトにユーザーのテキストメッセージを設定: {{ $json.text }}
  - _Requirements: 3.1_

- [ ] 3.2 レスポンス整形とエラーハンドリングの実装
  - Setノード（n8n-nodes-base.set v3）を追加し、"テキスト整形"という名前を設定
  - Geminiからのレスポンステキストを抽出し、2000文字を超える場合は分割する処理を実装
  - continueOnFail: trueを設定し、エラー時は「申し訳ございません。現在AIサービスが利用できません」を返す
  - タイムアウト30秒の設定を確認
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Gemini画像生成機能の実装
- [ ] 4.1 画像生成プロンプト抽出の実装
  - Setノード（n8n-nodes-base.set v3）を追加し、"プロンプト抽出"という名前を設定
  - "画像生成:"プレフィックスを除去してプロンプトを抽出: {{ $json.text.substring(5).trim() }}
  - 抽出したプロンプトを次のノードで使用できる形式に整形
  - _Requirements: 4.1_

- [ ] 4.2 Gemini画像生成ノードの実装
  - Google Geminiノード（@n8n/n8n-nodes-langchain.googleGemini v1）を追加し、"Gemini画像生成"という名前を設定
  - resource: "image", operation: "generate"に設定
  - modelId: "imagen-4"を設定（design.mdの仕様に基づく）
  - continueOnFail: trueを設定し、エラー時は「画像の生成に失敗しました。別の説明をお試しください」を返す
  - _Requirements: 4.2, 4.4_

- [ ] 4.3 画像アップロードとURL生成の実装
  - HTTP Requestノード（n8n-nodes-base.httpRequest v4）を追加し、"画像アップロード"という名前を設定
  - 生成された画像を一時ストレージにアップロードする処理を実装（具体的なストレージサービスは実装時に決定）
  - アップロード後の画像URLを取得し、LINE画像メッセージ形式に整形
  - _Requirements: 4.3_

- [ ] 5. Gemini音声文字起こし機能の実装
- [ ] 5.1 音声ファイルダウンロードの実装
  - HTTP Requestノード（n8n-nodes-base.httpRequest v4）を追加し、"音声ダウンロード"という名前を設定
  - URL: https://api-data.line.me/v2/bot/message/{{ $json.messageId }}/content
  - 認証ヘッダー: Authorization: Bearer {{ $credentials.lineChannelAccessToken }}
  - responseFormat: "file"に設定してバイナリデータとして受信
  - _Requirements: 5.1_

- [ ] 5.2 音声ファイルサイズチェックの実装
  - Functionノード（n8n-nodes-base.function v1）を追加し、"ファイルサイズチェック"という名前を設定
  - ダウンロードした音声ファイルのサイズを確認し、5MB以上の場合はエラーを返す処理を実装
  - エラー時は「音声ファイルが大きすぎます。5MB以下のファイルを送信してください」を設定
  - _Requirements: 5.4_

- [ ] 5.3 Gemini音声文字起こしノードの実装
  - Google Geminiノード（@n8n/n8n-nodes-langchain.googleGemini v1）を追加し、"Gemini音声文字起こし"という名前を設定
  - resource: "audio", operation: "transcribe"に設定
  - 音声データをGemini APIに送信する設定を実装
  - continueOnFail: trueを設定し、形式エラー時は「サポートされていない音声形式です」を返す
  - _Requirements: 5.2, 5.5_

- [ ] 5.4 文字起こし結果整形の実装
  - Setノード（n8n-nodes-base.set v3）を追加し、"文字起こし整形"という名前を設定
  - 文字起こし結果を「文字起こし結果:\n[内容]」形式に整形
  - 空の結果の場合は「音声を認識できませんでした」を設定
  - _Requirements: 5.3_

- [ ] 6. LINE返信処理とエラーハンドリングの統合実装
- [ ] 6.1 LINE返信HTTPノードの実装
  - HTTP Requestノード（n8n-nodes-base.httpRequest v4）を追加し、"LINE返信"という名前を設定
  - URL: https://api.line.me/v2/bot/message/reply
  - Method: POST、認証ヘッダーとContent-Type: application/jsonを設定
  - replyTokenと返信メッセージを含むJSONボディを構築
  - retryOnFail: true, maxTries: 3, waitBetweenTries: 2000を設定
  - _Requirements: 6.2_

- [ ] 6.2 統合エラーハンドラーの実装
  - Functionノード（n8n-nodes-base.function v1）を追加し、"エラーハンドラー"という名前を設定
  - design.mdのエラーハンドラーコードを実装し、エラータイプ別のメッセージマッピングを設定
  - エラーログの記録とユーザー向けメッセージの生成処理を実装
  - すべてのエラー発生可能ノードからエラー出力をこのハンドラーに接続
  - _Requirements: 6.1, 6.3, 6.5_

- [ ] 6.3 レート制限チェックの実装
  - Functionノード（n8n-nodes-base.function v1）を追加し、"レート制限チェック"という名前を設定
  - Static Dataを使用してユーザーごとのリクエスト回数を記録
  - 1分間に10回以上のリクエストを検出したら「しばらくお待ちください」を返す処理を実装
  - Webhook受信直後、署名検証の後に配置
  - _Requirements: 7.3_

- [ ] 7. ワークフロー全体の統合とテスト準備
- [ ] 7.1 すべてのノード接続の最終確認と調整
  - workflow.mdのconnections構造に従い、すべてのノード間接続を検証
  - 各処理フローが正しくLINE返信ノードに接続されていることを確認
  - エラー処理フローがすべてのノードから適切に接続されていることを確認
  - Webhook応答ノードが最後に実行されることを確認
  - _Requirements: 1.1, 6.1_

- [ ] 7.2 ワークフロー設定とメタデータの最終調整
  - ワークフローのsettings.executionOrderを"v1"に設定
  - versionIdにUUID形式の値を設定
  - activeをfalseに設定（テスト完了まで非アクティブ）
  - エラーワークフローIDを設定（必要に応じて）
  - タイムゾーンを"Asia/Tokyo"に設定
  - _Requirements: 7.1, 7.4_

- [ ] 7.3 テスト用Webhook URLの生成と動作確認準備
  - n8nのWebhook URLを確認し、LINE Developerコンソールに設定する準備
  - テスト用のLINE Channelを作成し、Channel Access TokenとChannel Secretを取得
  - n8n Credentialsに認証情報を安全に保存
  - 各種メッセージタイプ（テキスト、画像生成、音声）のテストケースを準備
  - _Requirements: 7.5_