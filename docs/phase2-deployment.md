# Phase 2 デプロイメントガイド

## 概要
Phase 2では、セッション管理と会話履歴の永続化機能を追加しました。

## 新機能
- ✅ PostgreSQLによる会話履歴の永続化
- ✅ セッション管理（新規作成・更新）
- ✅ 過去5件の会話履歴をコンテキストとして利用
- ✅ エラー時のファイルバックアップ機能
- ✅ 30日以上古いセッションの自動アーカイブ

## デプロイメント手順

### 1. PostgreSQLデータベースの準備

```bash
# PostgreSQLに接続
psql -U your_username -d your_database

# スキーマを実行
\i database/schema.sql
```

### 2. n8n環境変数の設定

```bash
# .envファイルに追加
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=chatbot_db
DB_POSTGRESDB_USER=your_user
DB_POSTGRESDB_PASSWORD=your_password
```

### 3. n8nでの認証情報設定

1. n8n UI → Credentials → New
2. PostgreSQL選択
3. 以下の情報を入力：
   - Host: localhost (または実際のホスト)
   - Database: chatbot_db
   - User: your_user
   - Password: your_password
   - Port: 5432
   - SSL: 本番環境では有効化推奨

### 4. ワークフローのインポート

```bash
# Phase 2ワークフローをインポート
n8n import:workflow --input=workflows/intelligent-learning-chatbot-phase2.json

# または、n8n UIから手動でインポート
```

### 5. バックアップディレクトリの作成

```bash
# n8nのデータディレクトリ内に作成
mkdir -p ~/.n8n/backup
chmod 755 ~/.n8n/backup
```

### 6. ワークフローの有効化

1. n8n UIでワークフローを開く
2. Active トグルをONに設定
3. Save ボタンをクリック

## テスト方法

### 基本的なテスト

```bash
# 新規セッションでのテスト
curl -X POST http://localhost:5678/webhook/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "こんにちは、私の名前は太郎です"
  }'

# セッションIDを指定したテスト
curl -X POST http://localhost:5678/webhook/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "私の名前を覚えていますか？",
    "sessionId": "前のレスポンスで返されたsessionId",
    "userId": "user-001"
  }'
```

### データベース確認

```sql
-- 会話履歴の確認
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 10;

-- アクティブセッションの確認
SELECT * FROM sessions WHERE is_active = true;

-- 特定セッションの履歴確認
SELECT * FROM conversations 
WHERE session_id = 'your-session-id'::uuid 
ORDER BY created_at DESC;
```

## トラブルシューティング

### PostgreSQL接続エラー

```bash
# 接続テスト
psql -h localhost -U your_user -d chatbot_db -c "SELECT 1;"

# n8nログ確認
docker logs n8n # Dockerの場合
journalctl -u n8n # systemdの場合
```

### セッションが保存されない

1. PostgreSQLのログを確認
2. `uuid-ossp`拡張が有効か確認：
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
   ```

### バックアップファイルが作成されない

1. ディレクトリの権限確認
2. n8nプロセスの書き込み権限確認
3. ディスク容量確認

## パフォーマンス最適化

### インデックスの確認

```sql
-- インデックス使用状況
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 遅いクエリの確認
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%conversations%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 定期メンテナンス

```sql
-- 統計情報の更新
ANALYZE conversations;
ANALYZE sessions;

-- 不要データのクリーンアップ（30日以上前）
DELETE FROM conversations 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- VACUUMの実行
VACUUM ANALYZE conversations;
```

## 監視設定

### Grafanaダッシュボード用クエリ

```sql
-- 時間別会話数
SELECT 
  date_trunc('hour', created_at) as hour,
  COUNT(*) as conversation_count
FROM conversations
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;

-- アクティブセッション数
SELECT COUNT(*) as active_sessions
FROM sessions
WHERE is_active = true
AND last_activity > CURRENT_TIMESTAMP - INTERVAL '1 hour';

-- 平均応答長
SELECT 
  AVG(LENGTH(ai_response)) as avg_response_length,
  MAX(LENGTH(ai_response)) as max_response_length
FROM conversations
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '1 day';
```

## 次のステップ

Phase 3では以下の機能を実装予定：
- フィードバック機能の追加
- 満足度スコアの記録
- 管理者への自動通知
- 週次レポート生成