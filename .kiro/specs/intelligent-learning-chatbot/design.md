# 設計書

## 概要
本設計書は、インテリジェント学習型チャットボットワークフローの技術設計を定義します。n8nの特性を活かし、段階的に拡張可能なアーキテクチャを採用し、シンプルな実装から始めて徐々に高度な機能を追加していきます。

## システムアーキテクチャ

### 全体構成
```
[Webhook Input] → [Session Manager] → [Context Retriever] → [AI Engine] → [Response Generator]
                          ↓                    ↓                  ↓
                  [Session Storage]    [Vector Database]   [Feedback Loop]
                                              ↓                  ↓
                                      [Conversation DB]   [Analytics Engine]
```

### フェーズ別実装計画

#### Phase 1: 基本チャットボット（MVP）
- **Webhook Node**: HTTPリクエスト受信
- **OpenAI Chat Model Node**: 基本的な応答生成
- **HTTP Response Node**: JSON形式での応答返却
- **実装時間**: 1-2時間

#### Phase 2: 会話履歴保存
- **PostgreSQL Node**: 会話データの永続化
- **Session ID Generator**: UUID生成によるセッション管理
- **Data Transform Node**: データ整形とタイムスタンプ付与
- **実装時間**: 2-3時間

#### Phase 3: フィードバック機能
- **Feedback Webhook**: 評価受信エンドポイント
- **Database Update Node**: フィードバックスコア記録
- **Notification Node**: 管理者通知（Slack/Email）
- **実装時間**: 2-3時間

#### Phase 4: RAG実装
- **Pinecone/Qdrant Node**: ベクトルDB連携
- **Embeddings Node**: テキストのベクトル化
- **Similarity Search Node**: 類似会話検索
- **Context Builder Node**: プロンプト拡張
- **実装時間**: 3-4時間

#### Phase 5: 学習メカニズム
- **Analytics Workflow**: 定期実行による分析
- **Pattern Recognition**: 成功パターンの抽出
- **Template Generator**: 応答テンプレート自動生成
- **実装時間**: 3-4時間

## データモデル

### 会話履歴テーブル (conversations)
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    metadata JSONB,
    embedding VECTOR(1536)
);

CREATE INDEX idx_session_id ON conversations(session_id);
CREATE INDEX idx_created_at ON conversations(created_at);
CREATE INDEX idx_embedding ON conversations USING ivfflat (embedding vector_cosine_ops);
```

### フィードバックテーブル (feedback)
```sql
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    rating INTEGER CHECK (rating IN (1, -1)),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_conversation_id ON feedback(conversation_id);
CREATE INDEX idx_rating ON feedback(rating);
```

### 応答テンプレートテーブル (response_templates)
```sql
CREATE TABLE response_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern TEXT NOT NULL,
    template TEXT NOT NULL,
    success_rate DECIMAL(3,2),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## n8nワークフロー設計

### メインワークフロー構成

#### 1. 入力処理サブフロー
```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "chatbot",
        "responseMode": "lastNode",
        "authentication": "headerAuth"
      }
    },
    {
      "name": "Validate Input",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [{
            "value1": "={{$json.message}}",
            "operation": "isNotEmpty"
          }]
        }
      }
    }
  ]
}
```

#### 2. セッション管理サブフロー
```json
{
  "nodes": [
    {
      "name": "Check Session",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM conversations WHERE session_id = $1 ORDER BY created_at DESC LIMIT 5"
      }
    },
    {
      "name": "Generate Session ID",
      "type": "n8n-nodes-base.crypto",
      "parameters": {
        "action": "uuid"
      }
    }
  ]
}
```

#### 3. コンテキスト検索サブフロー
```json
{
  "nodes": [
    {
      "name": "Generate Embedding",
      "type": "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
      "parameters": {
        "model": "text-embedding-3-small"
      }
    },
    {
      "name": "Vector Search",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM conversations ORDER BY embedding <=> $1 LIMIT 5"
      }
    }
  ]
}
```

#### 4. AI応答生成サブフロー
```json
{
  "nodes": [
    {
      "name": "Build Prompt",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [{
            "name": "systemPrompt",
            "value": "あなたは親切で知識豊富なアシスタントです。過去の会話履歴を参考に、一貫性のある応答を提供してください。"
          }]
        }
      }
    },
    {
      "name": "OpenAI Chat",
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "parameters": {
        "model": "gpt-4-turbo-preview",
        "temperature": 0.7,
        "maxTokens": 1000
      }
    }
  ]
}
```

#### 5. データ永続化サブフロー
```json
{
  "nodes": [
    {
      "name": "Save Conversation",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "conversations",
        "columns": "session_id,user_message,ai_response,user_id,metadata,embedding"
      }
    },
    {
      "name": "Error Handler",
      "type": "n8n-nodes-base.errorTrigger"
    },
    {
      "name": "Fallback Storage",
      "type": "n8n-nodes-base.writeBinaryFile",
      "parameters": {
        "fileName": "backup/{{$now}}_conversation.json"
      }
    }
  ]
}
```

## エラーハンドリング設計

### エラー階層
1. **Critical Errors**: システム全体停止
   - データベース接続失敗
   - API認証エラー
   
2. **Recoverable Errors**: リトライ可能
   - API一時的エラー
   - ネットワークタイムアウト
   
3. **Graceful Degradation**: 機能制限で継続
   - ベクトル検索失敗 → 基本応答
   - フィードバック記録失敗 → ログのみ

### リトライ戦略
```javascript
const retryConfig = {
  maxAttempts: 3,
  backoffStrategy: 'exponential',
  initialDelay: 1000,
  maxDelay: 10000,
  factor: 2
};
```

## セキュリティ設計

### 認証・認可
- Webhook: Bearer Token認証
- 管理API: API Key + IP制限
- データベース: SSL/TLS必須

### データ保護
- PII自動検出と除去
- 会話データの暗号化（AES-256）
- バックアップの定期削除

### レート制限
```javascript
const rateLimits = {
  perUser: {
    requests: 100,
    window: '1h'
  },
  perIP: {
    requests: 1000,
    window: '1h'
  },
  global: {
    requests: 10000,
    window: '1h'
  }
};
```

## パフォーマンス最適化

### キャッシング戦略
- セッションデータ: Redis（TTL: 1時間）
- ベクトル検索結果: インメモリ（TTL: 5分）
- AIレスポンス: なし（リアルタイム生成）

### 非同期処理
- フィードバック記録: キューイング
- 分析処理: バッチ実行（深夜）
- ベクトル生成: バックグラウンド

### スケーリング設計
- 水平スケーリング: n8nワーカーノード追加
- データベース: Read Replica活用
- ベクトルDB: シャーディング対応

## モニタリング設計

### メトリクス収集
```javascript
const metrics = {
  business: [
    'conversation_count',
    'user_satisfaction_score',
    'response_time_avg'
  ],
  technical: [
    'api_latency',
    'db_query_time',
    'error_rate'
  ],
  resource: [
    'cpu_usage',
    'memory_usage',
    'db_connections'
  ]
};
```

### アラート設定
- Response Time > 2秒: Warning
- Error Rate > 5%: Critical
- DB Connection Pool > 80%: Warning

### ダッシュボード構成
- リアルタイムメトリクス（Grafana）
- ビジネスKPI（週次/月次）
- エラーログ分析（ELK Stack）

## 実装の優先順位

### Priority 1（必須）
- Webhook受信と基本応答
- エラーハンドリング
- 基本的なログ記録

### Priority 2（重要）
- 会話履歴保存
- セッション管理
- フィードバック収集

### Priority 3（推奨）
- RAG機能
- 学習メカニズム
- 高度な分析

### Priority 4（オプション）
- マルチモーダル対応
- 多言語サポート
- カスタムモデル統合