# n8nワークフロー仕様ガイド

## 概要

このガイドは、n8n Actions自動化システムと互換性のあるn8nワークフローの完全なJSON構造と要件を定義します。

## コア構造

### 基本ワークフローテンプレート

```json
{
  "name": "ワークフロー名",
  "nodes": [],
  "connections": {},
  "active": false,
  "settings": {
    "executionOrder": "v1",
    "saveExecutionProgress": true,
    "saveDataSuccessExecution": "all",
    "saveDataErrorExecution": "all"
  },
  "versionId": "uuid",
  "meta": {
    "instanceId": "uuid"
  },
  "id": "unique_id",
  "tags": []
}
```

## 必須フィールド

### 1. メタデータフィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `name` | string | はい | ワークフロー表示名 |
| `nodes` | array | はい | ノード設定の配列 |
| `connections` | object | はい | ノード接続の定義 |
| `active` | boolean | はい | ワークフローのアクティブ状態 |
| `settings` | object | はい | 実行設定 |
| `id` | string | いいえ | ユニークなワークフロー識別子 |
| `tags` | array | いいえ | ワークフロー分類用タグ |

### 2. 設定の構成

**重要**: `saveDataSuccessExecution`と`saveDataErrorExecution`は文字列である必要があります！

```json
"settings": {
  "executionOrder": "v1",
  "saveExecutionProgress": true,          // ブール値
  "saveDataSuccessExecution": "all",      // 文字列 - "all"または"none"
  "saveDataErrorExecution": "all",        // 文字列 - "all"または"none"
  "executionTimeout": 3600,               // オプション、秒単位
  "timezone": "Asia/Tokyo"                // オプション
}
```

## ノード仕様

### ノード構造

```json
{
  "parameters": {},
  "id": "unique-node-id",
  "name": "ノード名",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1.1,
  "position": [250, 300]
}
```

### 一般的なノードタイプ

#### トリガーノード
```json
{
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1.1,
  "parameters": {
    "path": "webhook-path",
    "method": "POST",
    "responseMode": "onReceived"
  }
}
```

#### コア処理ノード
```json
{
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "parameters": {
    "language": "javaScript",
    "code": "// ここにコードを記述"
  }
}
```

#### AI/LLMノード
```json
{
  "type": "@n8n/n8n-nodes-langchain.agent",
  "typeVersion": 1,
  "parameters": {
    "promptType": "define"
  }
}
```

## 接続パターン

### 基本接続構造

```json
"connections": {
  "ソースノード名": {
    "main": [
      [
        {
          "node": "ターゲットノード名",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```

### 複数出力接続

```json
"connections": {
  "IF": {
    "main": [
      [{"node": "Trueブランチ", "type": "main", "index": 0}],
      [{"node": "Falseブランチ", "type": "main", "index": 0}]
    ]
  }
}
```

### AIエージェント接続

```json
"connections": {
  "Agent": {
    "ai_agent": [
      [{"node": "OpenAI Chat Model", "type": "ai_languageModel", "index": 0}]
    ],
    "ai_tool": [
      [{"node": "計算機", "type": "ai_tool", "index": 0}],
      [{"node": "コードツール", "type": "ai_tool", "index": 0}]
    ]
  }
}
```

## 検証ルール

### 1. 構造検証
- 有効なJSON構文
- すべての必須フィールドの存在
- 各フィールドの正しいデータ型

### 2. ノード検証
- n8nエコシステムの有効なノードタイプ
- 正しいバージョン番号
- 各ノードタイプの必須パラメータ

### 3. 接続検証
- 参照されるすべてのノードが存在する
- 接続タイプがノード機能と一致
- 循環依存がない

### 4. 設定検証
- `saveDataSuccessExecution`: "all"または"none"（文字列）である必要
- `saveDataErrorExecution`: "all"または"none"（文字列）である必要
- `executionOrder`: 互換性のため"v1"である必要

## ベストプラクティス

### 1. エラーハンドリング
```json
{
  "type": "n8n-nodes-base.errorTrigger",
  "parameters": {
    "errorMessage": "={{$json.error.message}}"
  }
}
```

### 2. リソース最適化
- 可能な場合はバッチ処理ノードを使用
- API呼び出しにレート制限を実装
- 重い処理の間に待機ノードを追加

### 3. データセキュリティ
- 機密データには認証システムを使用
- 入力検証を実装
- 出力をサニタイズ

## 一般的なパターン

### 1. Webhook → 処理 → レスポンス
```json
{
  "nodes": [
    {"type": "n8n-nodes-base.webhook", "name": "Webhook"},
    {"type": "n8n-nodes-base.code", "name": "処理"},
    {"type": "n8n-nodes-base.respondToWebhook", "name": "レスポンス"}
  ]
}
```

### 2. スケジュールデータ同期
```json
{
  "nodes": [
    {"type": "n8n-nodes-base.scheduleTrigger", "name": "スケジュール"},
    {"type": "n8n-nodes-base.httpRequest", "name": "データ取得"},
    {"type": "n8n-nodes-base.postgres", "name": "DBに保存"}
  ]
}
```

### 3. AI強化処理
```json
{
  "nodes": [
    {"type": "n8n-nodes-base.webhook", "name": "入力"},
    {"type": "@n8n/n8n-nodes-langchain.agent", "name": "AIエージェント"},
    {"type": "n8n-nodes-base.slack", "name": "通知"}
  ]
}
```

## テストと検証

### 検証スクリプトの例
```javascript
function validateWorkflow(workflow) {
  // 必須フィールドのチェック
  if (!workflow.name || !workflow.nodes || !workflow.connections) {
    return { valid: false, error: "必須フィールドが不足" };
  }
  
  // 設定の検証
  const { saveDataSuccessExecution, saveDataErrorExecution } = workflow.settings;
  if (typeof saveDataSuccessExecution !== 'string' || 
      typeof saveDataErrorExecution !== 'string') {
    return { valid: false, error: "設定は文字列である必要があります" };
  }
  
  return { valid: true };
}
```

## 移行ガイド

### v0.xからv1.0へ
1. ノードタイプ名を完全な形式に更新
2. 設定を文字列値に変換
3. `executionOrder: "v1"`を追加

## トラブルシューティング

| 問題 | 解決方法 |
|------|----------|
| "無効なワークフロー" | JSON構文を確認 |
| "ノードが見つからない" | ノードタイプとバージョンを確認 |
| "接続エラー" | 接続内のノード名を確認 |
| "設定タイプエラー" | 保存設定に文字列値を確保 |

---

*n8n v1.0+互換性のため最終更新*