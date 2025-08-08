# Phase 3 フィードバックシステム デプロイメントガイド

## 概要
Phase 3では、ユーザーからのフィードバックを収集し、AIの回答品質を継続的に改善するシステムを実装しました。

## 新機能
- ✅ フィードバック収集エンドポイント
- ✅ 5段階評価とテキストフィードバック
- ✅ 改善案の保存と学習
- ✅ フィードバック分析とトレンド追跡
- ✅ 学習ポイントの自動抽出

## システム構成

### エンドポイント
- **フィードバック送信**: POST `/webhook/chatbot/feedback`

### 必須パラメータ
```json
{
  "sessionId": "セッションID（UUID）",
  "conversationId": "会話ID（UUID）"
}
```

### オプションパラメータ
```json
{
  "userId": "ユーザーID",
  "rating": 1-5,
  "isHelpful": true/false,
  "feedbackText": "フィードバックテキスト",
  "feedbackType": "positive/negative/suggestion/correction",
  "improvedResponse": "改善された回答案"
}
```

## デプロイメント手順

### 1. データベーススキーマの適用

```bash
# PostgreSQLに接続
psql -U your_username -d chatbot_db

# フィードバックスキーマを実行
\i database/feedback-schema.sql

# テーブル確認
\dt feedback
\dt learning_improvements
```

### 2. ワークフローのインポート

```bash
# Phase 3ワークフローをインポート
n8n import:workflow --input=workflows/intelligent-learning-chatbot-phase3-feedback.json
```

### 3. ワークフローの有効化

1. n8n UIでワークフローを開く
2. OpenAI API認証情報を確認
3. PostgreSQL認証情報を確認
4. Active トグルをON
5. Save

## 使用例

### 基本的なフィードバック

```bash
# ポジティブフィードバック
curl -X POST http://localhost:5678/webhook/chatbot/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "conversationId": "660e8400-e29b-41d4-a716-446655440001",
    "rating": 5,
    "isHelpful": true,
    "feedbackText": "とても役に立ちました！"
  }'
```

### 改善提案付きフィードバック

```bash
# 改善案を含むフィードバック
curl -X POST http://localhost:5678/webhook/chatbot/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "conversationId": "660e8400-e29b-41d4-a716-446655440001",
    "rating": 3,
    "isHelpful": false,
    "feedbackText": "回答が冗長でした",
    "feedbackType": "suggestion",
    "improvedResponse": "より簡潔な回答例：..."
  }'
```

## データベース管理

### フィードバック確認

```sql
-- 最近のフィードバック
SELECT * FROM feedback_summary
LIMIT 10;

-- セッション別の平均評価
SELECT 
  session_id,
  get_session_rating_average(session_id) as avg_rating,
  COUNT(*) as feedback_count
FROM feedback
GROUP BY session_id
ORDER BY avg_rating DESC;

-- フィードバックトレンド（7日間）
SELECT * FROM get_feedback_trends(7);
```

### 学習改善の確認

```sql
-- 未適用の改善案
SELECT * FROM learning_improvements
WHERE applied = false
ORDER BY created_at DESC;

-- 改善タイプ別の集計
SELECT 
  improvement_type,
  COUNT(*) as count
FROM learning_improvements
GROUP BY improvement_type;
```

## フィードバックの活用

### 1. 自動学習
- 改善案が提供された場合、自動的に学習ポイントを抽出
- 今後の回答改善に活用

### 2. トレンド分析
- 日次の評価推移を追跡
- 問題のあるパターンを特定

### 3. 継続的改善
- フィードバックから学習
- 次回の会話で改善を適用

## トラブルシューティング

### フィードバックが保存されない
1. sessionIdとconversationIdが正しいUUID形式か確認
2. データベース接続を確認
3. テーブル権限を確認

### 分析が実行されない
1. OpenAI API認証情報を確認
2. improvedResponseが提供されているか確認

## 次のステップ

Phase 4では以下を実装予定:
- RAGシステムとの統合
- フィードバックから自動的に知識ベースを更新
- より高度な学習メカニズム