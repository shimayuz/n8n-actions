# Discord AI ChatBot 制御構造統合設計

## ワークフロー全体構造

### エラーハンドリング戦略
1. **Try-Catch構造**
   - メインフロー全体をTry-Catchで囲む
   - エラー時は管理者通知またはログ記録

2. **条件分岐**
   - メンションチェック（Function内で実装）
   - 応答生成成功/失敗の分岐

### ノード実行順序
```
[Webhook]
    ↓
[Parse Discord Message] (メンションチェック含む)
    ↓
[AI Agent] ← [OpenAI Chat Model]
    ↓
[Send Discord Message]
```

### 追加検討事項

#### 1. Error Trigger追加案
```json
{
  "name": "Error Handler",
  "type": "n8n-nodes-base.errorTrigger",
  "position": [650, 500],
  "parameters": {}
}
```
→ エラー時にDiscordに通知メッセージを送信

#### 2. レート制限対策
- Wait nodeで遅延を追加（必要に応じて）
- OpenAI APIのレート制限エラー時の再試行

#### 3. ログ記録
- 各ステップの実行結果をログファイルに記録（オプション）

## 最終ノード構成

### 必須ノード
1. Webhook
2. Parse Discord Message (Function)
3. AI Agent
4. OpenAI Chat Model
5. Send Discord Message

### オプションノード（将来の拡張用）
- Error Trigger
- Wait (レート制限対策)
- Set (データ整形用)

## 実行フロー制御
- **正常系**: Webhook → Parse → AI Agent → Discord送信
- **異常系**: エラー発生 → Error Trigger → エラーメッセージ送信

## パフォーマンス考慮事項
- Webhook応答は即座に返す（responseMode: "onReceived"）
- AI処理は非同期で実行
- タイムアウト設定: 30秒