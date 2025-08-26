# Webhook設定ガイド

## 概要

このガイドでは、GitHub webhook、n8n webhookノード、セキュリティのベストプラクティスを含む、n8nワークフローのwebhook設定について説明します。

## n8n Webhookノードのセットアップ

### 基本的なWebhook設定

```json
{
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1.1,
  "parameters": {
    "path": "unique-webhook-path",
    "method": "POST",
    "responseMode": "onReceived",
    "responseData": "firstEntryJson",
    "options": {
      "responseHeaders": {
        "values": [
          {
            "name": "Content-Type",
            "value": "application/json"
          }
        ]
      }
    }
  }
}
```

### Webhookメソッド

| メソッド | 使用例 | 例 |
|---------|--------|-----|
| `GET` | データ取得 | ステータス確認 |
| `POST` | データ送信 | フォーム処理 |
| `PUT` | 完全更新 | リソース置換 |
| `PATCH` | 部分更新 | フィールド変更 |
| `DELETE` | リソース削除 | クリーンアップ操作 |

### レスポンスモード

| モード | 説明 | 使用例 |
|--------|------|--------|
| `onReceived` | 即座にレスポンス | クイック確認 |
| `lastNode` | 完了を待つ | 完全処理 |
| `responseNode` | カスタムレスポンス | 複雑なロジック |

## GitHub Webhook設定

### GitHub Webhookのセットアップ

1. リポジトリの**Settings** → **Webhooks**に移動
2. **Add webhook**をクリック
3. webhook設定を構成

### GitHub Webhook設定項目

#### ペイロードURL
```
https://your-n8n-instance.com/webhook/[webhook-path]
```

#### コンテンツタイプ
選択: `application/json`

#### シークレット（オプション）
```
your-secret-key-here
```

#### SSL検証
- **本番環境**: SSL検証を有効化
- **開発環境**: 無効化可能（非推奨）

#### イベント選択

**n8n Actions自動化用:**
- ✓ Pull requests
- ✓ Issues
- ✓ Issue comments
- ✓ Push
- ✓ Workflow runs

### GitHubイベントペイロード

#### プルリクエストイベント
```json
{
  "action": "opened|closed|synchronize",
  "pull_request": {
    "id": 123,
    "number": 45,
    "title": "PRタイトル",
    "body": "PR説明",
    "state": "open|closed",
    "merged": true|false,
    "base": {
      "ref": "main"
    },
    "head": {
      "ref": "feature-branch"
    }
  }
}
```

#### Issueイベント
```json
{
  "action": "opened|edited|closed",
  "issue": {
    "number": 67,
    "title": "Issueタイトル",
    "body": "Issue説明",
    "labels": [
      {
        "name": "workflow-request"
      }
    ]
  }
}
```

## Webhookセキュリティ

### 1. 認証方法

#### HMAC署名検証
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${hash}` === signature;
}
```

#### APIキー認証
```json
{
  "parameters": {
    "authentication": "headerAuth",
    "genericAuthType": "httpHeaderAuth",
    "httpHeaderAuth": {
      "name": "X-API-Key",
      "value": "={{$credentials.apiKey}}"
    }
  }
}
```

### 2. レート制限

```javascript
const rateLimit = {
  window: 60000, // 1分
  max: 100, // 最大リクエスト数
  message: 'リクエストが多すぎます'
};
```

### 3. IPホワイトリスト

```javascript
const allowedIPs = [
  '140.82.112.0/20', // GitHub webhooks
  '143.55.64.0/20',  // GitHub webhooks
  '192.30.252.0/22', // GitHub webhooks
  '185.199.108.0/22' // GitHub Pages
];
```

## 高度なWebhookパターン

### 1. Webhookルーター

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "name": "Webhookエントリー"
    },
    {
      "type": "n8n-nodes-base.switch",
      "name": "イベントでルーティング",
      "parameters": {
        "dataType": "string",
        "value1": "={{$json.headers['x-github-event']}}",
        "rules": {
          "rules": [
            {
              "value2": "pull_request",
              "output": 0
            },
            {
              "value2": "issues",
              "output": 1
            }
          ]
        }
      }
    }
  ]
}
```

### 2. Webhookキュー

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "name": "受信",
      "parameters": {
        "responseMode": "onReceived"
      }
    },
    {
      "type": "n8n-nodes-base.rabbitmq",
      "name": "キュー",
      "parameters": {
        "queue": "webhook-queue"
      }
    }
  ]
}
```

### 3. Webhookリトライロジック

```javascript
{
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "={{$node['Webhook'].json.callback_url}}",
    "options": {
      "retry": {
        "maxTries": 3,
        "waitBetweenTries": 5000,
        "maxRetryAfter": 60000
      }
    }
  }
}
```

## Webhookのテスト

### 1. ngrokを使用したローカルテスト

```bash
# ngrokをインストール
npm install -g ngrok

# n8nをローカルで開始
n8n start

# ローカルn8nを公開
ngrok http 5678

# webhook用にngrok URLを使用
https://abc123.ngrok.io/webhook/test
```

### 2. Webhookテストツール

```bash
# curlを使用
curl -X POST https://your-n8n.com/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# httpieを使用
http POST https://your-n8n.com/webhook/test \
  test=data
```

### 3. n8nテストWebhook

```javascript
// テストwebhookノード設定
{
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "test",
    "options": {
      "responseCode": 200,
      "responseData": "allEntries"
    }
  }
}
```

## 監視とデバッグ

### 1. Webhookログ

```javascript
// webhookログを有効化
{
  "parameters": {
    "options": {
      "logReceivedData": true,
      "saveDataErrorExecution": "all",
      "saveDataSuccessExecution": "all"
    }
  }
}
```

### 2. デバッグヘッダー

```javascript
// すべてのヘッダーをログ
const headers = $input.item.json.headers;
console.log('受信ヘッダー:', headers);

// 特定のヘッダーを確認
const githubEvent = headers['x-github-event'];
console.log('GitHubイベント:', githubEvent);
```

### 3. エラーハンドリング

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.errorTrigger",
      "name": "エラーキャッチ"
    },
    {
      "type": "n8n-nodes-base.slack",
      "name": "エラー時アラート",
      "parameters": {
        "channel": "#alerts",
        "text": "Webhookエラー: {{$json.error.message}}"
      }
    }
  ]
}
```

## パフォーマンス最適化

### 1. 非同期処理
- 即座のレスポンスには`responseMode: "onReceived"`を使用
- データを非同期で処理
- 重い処理にはキューシステムを実装

### 2. ペイロードサイズ制限
```javascript
{
  "options": {
    "maxPayloadSize": "10mb",
    "timeout": 30000
  }
}
```

### 3. キャッシング戦略
- 頻繁にアクセスされるデータをキャッシュ
- レスポンスキャッシングを実装
- 静的webhookレスポンスにCDNを使用

## よくある問題と解決策

| 問題 | 原因 | 解決策 |
|------|------|--------|
| Webhookがトリガーされない | 不正なパス | webhook URLが一致するか確認 |
| 404エラー | ワークフロー非アクティブ | n8nでワークフローをアクティブ化 |
| タイムアウトエラー | 長い処理 | 非同期レスポンスモードを使用 |
| 認証失敗 | 間違った認証情報 | シークレット/APIキーを確認 |
| 重複イベント | 複数のwebhook | 冪等性を実装 |

## ベストプラクティス

1. **ユニークなwebhookパス**を使用して競合を回避
2. 本番webhookには**認証を実装**
3. 悪用防止のため**レート制限を追加**
4. デバッグのため**webhookイベントをログ**
5. すべての本番webhookで**HTTPSを使用**
6. 重複イベント処理のため**冪等性を実装**
7. 処理に**適切なタイムアウトを設定**
8. アラートで**webhookの健全性を監視**

---

*n8n Actions自動化システムの一部*