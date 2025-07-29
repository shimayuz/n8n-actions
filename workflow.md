# workflow.md（n8nワークフロー設計・生成 厳格ガイドライン）

**バージョン: 2025.7**  
**最終更新: 2025年7月**

---

## 1. 本ドキュメントの目的

本ガイドは、n8nのインポート用ワークフロー（.json）を人間・AIが設計・生成・レビュー・保守するための**唯一のリファレンス**である。
本ガイドを厳守することで、以下の品質を保証する：

* n8nでエラーなくインポート・実行できる
* 構造の抜け漏れがない
* 可読性と保守性が高い
* セキュリティリスクが低い
* チーム間で共通認識のある成果物となる

---

## 1.5. ワークフロー作成開始前の必須手順

### 1.5.1 類似ワークフローリサーチ（必須）

ユーザーからワークフロー作成要求を受けた際は、**必ず以下の手順を実行**すること：

#### Step 1: n8n-MCP経由での既存ワークフロー確認
```bash
# n8n-MCPサーバーで既存ワークフローを検索
# 注意: 以下は利用可能なn8n-mcpツールの例
tools_documentation()               # 利用可能ツール一覧確認
list_nodes()                       # 利用可能ノード一覧取得
search_nodes(query: "keyword")     # ノード検索
get_node_info(node_type)           # ノード詳細情報取得
list_ai_tools()                    # AIツール一覧取得
```

#### Step 2: ローカルプロジェクトでの類似性確認
- `projects/` ディレクトリ内の既存プロジェクトを確認
- `workflows/` ディレクトリ内の既存ワークフローを確認
- `.workflow.json` の登録済みワークフロー一覧を参照

#### Step 3: 重複回避判定
- **類似ワークフローが存在する場合**:
  - 既存ワークフローの拡張・改修で対応可能か検討
  - 差分が明確で新規作成が必要な場合のみ新規作成を継続
  - ユーザーに既存ワークフローの存在を報告し、方針を確認

- **類似ワークフローが存在しない場合**:
  - 新規ワークフロー作成を開始
  - プロジェクトディレクトリ `projects/[workflow-name]/` を作成

#### Step 4: 作成方針の決定
```markdown
# リサーチ結果報告テンプレート
## 既存ワークフロー確認結果
- **n8n-MCP検索結果**: [件数] 件のワークフローを確認
- **類似ワークフロー**: [あり/なし]
  - 類似ワークフロー名: [名前]
  - 類似度: [高/中/低]
  - 差分: [主な違い]

## 推奨アクション
- [ ] 既存ワークフロー拡張
- [ ] 新規ワークフロー作成
- [ ] 既存ワークフロー活用

理由: [判断根拠]
```

### 1.5.2 重要な注意事項
- **リサーチなしでの新規作成は禁止**
- 類似ワークフローが見つかった場合は必ずユーザーに報告
- 既存ワークフローの活用を優先し、車輪の再発明を回避
- プロジェクト全体の一貫性と効率性を重視

---

## 2. n8nワークフローJSON構造の必須要素

### 2.1 トップレベル構造

n8nワークフローJSONのトップは必ず**下記キーを含む**こと。

| キー          | 型       | 必須 | 説明                                          | デフォルト値 |
| :----------- | :------- | :--- | :-------------------------------------------- | :---------- |
| name         | string   | ◯    | ワークフローの名称。日本語/英語どちらも可     | なし        |
| nodes        | array    | ◯    | ワークフロー内すべてのノード情報の配列        | []          |
| connections  | object   | ◯    | ノード間の接続関係                            | {}          |
| versionId    | string   | ◯    | ワークフローのユニークID（UUID形式推奨）      | なし        |
| active       | boolean  | ◯    | ワークフローの有効/無効                       | false       |
| settings     | object   | ◯    | ワークフロー全体の設定                        | {}          |
| id           | string   | △    | ワークフロー自体のユニークID                  | ""          |
| tags         | array    | △    | 任意のタグ付け                                | []          |
| meta         | object   | △    | メタデータ（作成日時、作成者等）              | null        |
| staticData   | object   | △    | ワークフロー固有の静的データ                  | null        |

例（最小構成）:
```json
{
  "name": "サンプルWF",
  "nodes": [],
  "connections": {},
  "versionId": "xxx",
  "active": false,
  "settings": {}
}
```

---

### 2.2 nodes配列の定義

各ノードは配列内で**個別のobject**として定義。

#### 必須フィールド（全ノード共通）

| キー          | 型      | 必須 | 説明                                           | 例                                    |
| :----------- | :------ | :--- | :--------------------------------------------- | :------------------------------------ |
| parameters   | object  | ◯    | ノード固有のパラメータ                         | {}                                    |
| name         | string  | ◯    | ノード名（ワークフロー内でユニーク）           | "HTTPリクエスト送信"                   |
| type         | string  | ◯    | ノードの種別                                   | "n8n-nodes-base.httpRequest"          |
| typeVersion  | number  | ◯    | 使用するノードのバージョン                     | 4                                     |
| position     | array   | ◯    | [x,y]座標（整数）                             | [240, 300]                            |
| id           | string  | ◯    | ノード固有ID（UUID v4形式推奨）               | "a1b2c3d4-e5f6-7890-abcd-ef1234567890" |

#### オプションフィールド

| キー              | 型       | 必須 | 説明                                    | 例                    |
| :--------------- | :------- | :--- | :-------------------------------------- | :-------------------- |
| credentials      | object   | △    | API連携等で使う場合の認証情報参照       | {"httpBasicAuth": {"id": "xxx"}} |
| notes            | string   | △    | ノード説明/補足（日本語推奨）           | "APIレスポンスを解析" |
| disabled         | boolean  | △    | ノードの無効化                          | false                 |
| continueOnFail   | boolean  | △    | エラー時も処理継続                      | false                 |
| notesInFlow      | boolean  | △    | フロー内にnotesを表示                   | false                 |
| retryOnFail      | boolean  | △    | 失敗時の自動リトライ                    | false                 |
| maxTries         | number   | △    | リトライ回数                            | 3                     |
| waitBetweenTries | number   | △    | リトライ間隔（ミリ秒）                  | 1000                  |
| webhookId        | string   | △    | Webhookノードの場合のID                 | null                  |

---

### 2.3 connections構造

`connections`は、**ノード同士の接続を定義するobject**。

基本構造:
```json
{
  "ノード名": {
    "main": [
      [
        {
          "node": "接続先ノード名",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```

#### 複数出力の場合
```json
{
  "IF分岐ノード": {
    "main": [
      [
        {"node": "True側ノード", "type": "main", "index": 0}
      ],
      [
        {"node": "False側ノード", "type": "main", "index": 0}
      ]
    ]
  }
}
```

#### エラーハンドリング接続
```json
{
  "HTTPリクエスト": {
    "main": [
      [{"node": "成功時処理", "type": "main", "index": 0}]
    ],
    "error": [
      [{"node": "エラー時処理", "type": "main", "index": 0}]
    ]
  }
}
```

---

## 3. n8nワークフロー設計の必須ガイドライン

### 3.1 命名規則

#### ワークフロー名
- **明確な目的を示す名称**を使用
- **English only**
- 例: `"Customer Data Sync Workflow"`, `"Daily Report Generator"`

#### ノード名
- **ノードの役割が明確な名前**を使用
- **English only**
- 同じ種類のノードが複数ある場合は番号や用途を付加
- 良い例: `"HTTP Request (User Fetch)"`, `"Data Formatting 1"`, `"Slack Notification"`
- 悪い例: `"Set"`, `"Node1"`, `"あ"`

#### 日本語解説の使用
- **ワークフロー内の解説・説明は日本語で記述**
- **Sticky Note**を使用して日本語で詳細な解説を追加
- **notesフィールド**にも日本語で処理内容を記録
- 例: Sticky Note「このHTTPリクエストでユーザー情報を取得し、次のデータ整形ノードで必要な形式に変換します」
- 例: notes「APIレスポンスからユーザーIDと名前のみを抽出する処理」

### 3.2 ノードtypeVersion

必ず**最新の安定版バージョン**を指定すること。

主要ノードの推奨バージョン（2025年7月時点）:
- HTTP Request: 4
- Set: 3
- IF: 3
- Function: 1
- Webhook: 2
- Merge: 3
- Split In Batches: 3

### 3.3 credentialsの扱い

#### 基本ルール
1. **プレーンなAPIキー等は直接記述禁止**
2. 必ず`credentials`オブジェクトで参照形式を使用
3. IDは事前にn8nで作成した認証情報のIDを指定

#### 記述例
```json
"credentials": {
  "httpBasicAuth": {
    "id": "n8n-credential-id-xxx"
  }
}
```

### 3.4 Expression/コード内記法

#### 基本的な式
```javascript
// 単純な値参照
{{ $json.fieldName }}

// 条件式
{{ $json.status === 'active' ? 'OK' : 'NG' }}

// 文字列結合
{{ $json.firstName + ' ' + $json.lastName }}
```

#### 複雑なロジック（IIFE パターン）
```javascript
{{
  (() => {
    const data = $json;
    const items = data.items || [];
    return items
      .filter(item => item.active)
      .map(item => ({
        id: item.id,
        name: item.name.toUpperCase()
      }));
  })()
}}
```

#### データ参照パターン
- 現在のノードのデータ: `$json`
- 前のノードのデータ: `$input.item.json`
- 特定ノードのデータ: `$('ノード名').item.json`
- 全アイテム: `$items()`
- ワークフロー変数: `$workflow`

### 3.5 MCPサーバー統合

#### Model Context Protocol (MCP) サーバー連携
n8nワークフローでMCPサーバーと連携する際の推奨パターン：

##### 基本構成
1. **Webhook Trigger**: MCPリクエストの受信
2. **Function Node**: リクエストの解析とルーティング
3. **HTTP Request**: 外部APIやサービスへの接続
4. **Set Node**: レスポンスフォーマットの整形
5. **Respond to Webhook**: MCPへのレスポンス返却

##### MCPツール定義の例
```json
{
  "name": "get_workflow_status",
  "description": "Get the status of a specific workflow",
  "parameters": {
    "workflowId": {
      "type": "string",
      "description": "The ID of the workflow"
    }
  }
}
```

##### レスポンス形式
```json
{
  "content": [
    {
      "type": "text",
      "text": "Workflow status information"
    }
  ]
}
```

#### MCP統合時の注意点
- **認証**: Bearer tokenまたはAPI keyによる認証を実装
- **エラーハンドリング**: MCPプロトコルに準拠したエラーレスポンス
- **タイムアウト**: 30秒以内にレスポンスを返す
- **ペイロードサイズ**: 最大10MBまでのレスポンス

### 3.6 エラーハンドリング

#### continueOnFailの使用
```json
{
  "continueOnFail": true,
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 2000
}
```

#### Try-Catch パターン（Functionノード）
```javascript
try {
  // メイン処理
  const result = processData($json);
  return [{json: result}];
} catch (error) {
  // エラー処理
  return [{
    json: {
      error: true,
      message: error.message,
      originalData: $json
    }
  }];
}
```

---

## 4. 主要ノードごとの詳細仕様

### 4.1 Start ノード

```json
{
  "parameters": {},
  "name": "Start",
  "type": "n8n-nodes-base.start",
  "typeVersion": 1,
  "position": [240, 300],
  "id": "start-node-id"
}
```

### 4.2 HTTP Request ノード

```json
{
  "parameters": {
    "url": "https://api.example.com/v1/data",
    "method": "GET",
    "responseFormat": "json",
    "options": {
      "timeout": 30000,
      "retry": {
        "maxRetries": 3,
        "retryInterval": 1000
      }
    },
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    }
  },
  "name": "API取得",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4,
  "position": [450, 300],
  "id": "http-node-id",
  "credentials": {
    "httpBasicAuth": {
      "id": "credential-id"
    }
  }
}
```

### 4.3 Set ノード

```json
{
  "parameters": {
    "mode": "manual",
    "values": {
      "string": [
        {
          "name": "status",
          "value": "={{ $json.active ? 'アクティブ' : '非アクティブ' }}"
        }
      ],
      "number": [
        {
          "name": "total",
          "value": "={{ $json.price * $json.quantity }}"
        }
      ],
      "boolean": [
        {
          "name": "isValid",
          "value": "={{ $json.errors.length === 0 }}"
        }
      ]
    }
  },
  "name": "データ整形",
  "type": "n8n-nodes-base.set",
  "typeVersion": 3,
  "position": [650, 300],
  "id": "set-node-id"
}
```

### 4.4 IF（条件分岐）ノード

```json
{
  "parameters": {
    "conditions": {
      "string": [
        {
          "value1": "={{ $json.status }}",
          "operation": "equals",
          "value2": "success"
        }
      ],
      "number": [
        {
          "value1": "={{ $json.count }}",
          "operation": "larger",
          "value2": 10
        }
      ]
    },
    "combineOperation": "all"
  },
  "name": "条件分岐",
  "type": "n8n-nodes-base.if",
  "typeVersion": 3,
  "position": [850, 300],
  "id": "if-node-id"
}
```

### 4.5 Function ノード

```json
{
  "parameters": {
    "functionCode": "// データ変換処理\nconst items = $input.all();\n\nreturn items.map(item => {\n  const data = item.json;\n  \n  // 処理ロジック\n  const processed = {\n    id: data.id,\n    name: data.name.trim().toUpperCase(),\n    timestamp: new Date().toISOString(),\n    calculated: data.price * data.quantity * 1.1\n  };\n  \n  return {\n    json: processed,\n    pairedItem: item.pairedItem\n  };\n});"
  },
  "name": "データ変換",
  "type": "n8n-nodes-base.function",
  "typeVersion": 1,
  "position": [1050, 300],
  "id": "function-node-id"
}
```

### 4.6 Merge ノード

```json
{
  "parameters": {
    "mode": "combine",
    "combinationMode": "mergeByPosition",
    "options": {}
  },
  "name": "データ結合",
  "type": "n8n-nodes-base.merge",
  "typeVersion": 3,
  "position": [1250, 300],
  "id": "merge-node-id"
}
```

---

## 5. ワークフロー生成・レビュー時のチェックリスト

### 5.1 構造チェック
- [ ] トップレベルに必須キーがすべて存在
- [ ] `name`, `nodes`, `connections`, `versionId`, `active`, `settings`が含まれる
- [ ] JSONとして文法的に正しい（カンマ、括弧の対応等）

### 5.2 ノードチェック
- [ ] 各ノードに必須フィールドがすべて存在
- [ ] ノード名がワークフロー内でユニーク
- [ ] typeVersionが最新の安定版
- [ ] positionが適切に設定されている
- [ ] IDがユニーク（UUID推奨）

### 5.3 接続チェック
- [ ] connectionsの参照先ノードがすべて存在
- [ ] ノード名のタイポがない
- [ ] 出力インデックスが正しい

### 5.4 パラメータチェック
- [ ] 必須パラメータがすべて設定されている
- [ ] 式の記法がn8n仕様に準拠
- [ ] credentialsが必要な場合、正しく設定されている

### 5.5 セキュリティチェック
- [ ] APIキー等の機密情報が直接記述されていない
- [ ] credentialsはID参照形式
- [ ] 外部URLが正しくエスケープされている

### 5.6 品質チェック
- [ ] ノード名が役割を明確に示している
- [ ] 必要に応じてnotesが記載されている
- [ ] エラーハンドリングが適切
- [ ] リトライ設定が適切

---

## 6. 完全なワークフローサンプル

### 6.1 シンプルなWebhook → レスポンス

```json
{
  "name": "Webhook受信してレスポンス返却",
  "nodes": [
    {
      "parameters": {
        "path": "sample-webhook",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook受信",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300],
      "id": "webhook-id"
    },
    {
      "parameters": {
        "mode": "manual",
        "values": {
          "string": [
            {
              "name": "message",
              "value": "データを受信しました"
            },
            {
              "name": "timestamp",
              "value": "={{ new Date().toISOString() }}"
            }
          ]
        }
      },
      "name": "レスポンス準備",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3,
      "position": [450, 300],
      "id": "set-id"
    },
    {
      "parameters": {
        "responseCode": 200,
        "responseData": "={{ JSON.stringify($json) }}",
        "options": {
          "responseHeaders": {
            "entries": [
              {
                "name": "Content-Type",
                "value": "application/json"
              }
            ]
          }
        }
      },
      "name": "レスポンス返却",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [650, 300],
      "id": "respond-id"
    }
  ],
  "connections": {
    "Webhook受信": {
      "main": [[{"node": "レスポンス準備", "type": "main", "index": 0}]]
    },
    "レスポンス準備": {
      "main": [[{"node": "レスポンス返却", "type": "main", "index": 0}]]
    }
  },
  "versionId": "v1-webhook-sample",
  "active": false,
  "settings": {
    "executionOrder": "v1"
  }
}
```

### 6.2 API連携とエラーハンドリング

```json
{
  "name": "API連携with エラーハンドリング",
  "nodes": [
    {
      "parameters": {},
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [240, 300],
      "id": "start-id"
    },
    {
      "parameters": {
        "url": "https://api.example.com/users",
        "method": "GET",
        "responseFormat": "json",
        "options": {
          "timeout": 10000
        }
      },
      "name": "ユーザー取得API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [450, 300],
      "id": "http-id",
      "continueOnFail": true,
      "notes": "ユーザー一覧を取得。エラー時も処理継続"
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.error }}",
              "operation": "false"
            }
          ]
        }
      },
      "name": "成功判定",
      "type": "n8n-nodes-base.if",
      "typeVersion": 3,
      "position": [650, 200],
      "id": "if-id"
    },
    {
      "parameters": {
        "functionCode": "// データ整形\nconst users = $json.data || [];\n\nreturn users.map(user => ({\n  json: {\n    id: user.id,\n    name: `${user.firstName} ${user.lastName}`,\n    email: user.email,\n    active: user.status === 'active'\n  }\n}));"
      },
      "name": "ユーザーデータ整形",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [850, 150],
      "id": "function-success-id"
    },
    {
      "parameters": {
        "mode": "manual",
        "values": {
          "string": [
            {
              "name": "error",
              "value": "APIエラーが発生しました"
            },
            {
              "name": "details",
              "value": "={{ $json.message || 'Unknown error' }}"
            }
          ]
        }
      },
      "name": "エラーメッセージ生成",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3,
      "position": [850, 350],
      "id": "set-error-id"
    }
  ],
  "connections": {
    "Start": {
      "main": [[{"node": "ユーザー取得API", "type": "main", "index": 0}]]
    },
    "ユーザー取得API": {
      "main": [[{"node": "成功判定", "type": "main", "index": 0}]]
    },
    "成功判定": {
      "main": [
        [{"node": "ユーザーデータ整形", "type": "main", "index": 0}],
        [{"node": "エラーメッセージ生成", "type": "main", "index": 0}]
      ]
    }
  },
  "versionId": "v1-api-error-handling",
  "active": false,
  "settings": {
    "errorWorkflow": "error-handler-workflow-id",
    "timezone": "Asia/Tokyo",
    "saveExecutionProgress": true,
    "saveDataSuccessExecution": true,
    "saveDataErrorExecution": true
  }
}
```

---

## 7. ベストプラクティス

### 7.1 設計原則
1. **単一責任の原則**: 各ノードは1つの明確な責任を持つ
2. **エラーハンドリング**: すべての外部連携にはエラー処理を実装
3. **再利用性**: 共通処理はサブワークフローとして切り出す
4. **ドキュメント化**: notesフィールドを活用して処理内容を記録

### 7.2 パフォーマンス最適化
1. **バッチ処理**: 大量データは`Split In Batches`ノードで分割処理
2. **並列処理**: 独立した処理は並列実行
3. **キャッシュ活用**: 静的データは`staticData`に保存
4. **不要なループ回避**: 配列操作は`Function`ノードでまとめて処理

### 7.3 セキュリティ
1. **最小権限の原則**: credentialsは必要最小限の権限で設定
2. **入力検証**: 外部からのデータは必ず検証
3. **秘密情報の管理**: 環境変数やn8nの認証ストアを活用
4. **ログ管理**: 機密情報をログに出力しない

---

## 8. 禁止事項

### 8.1 構造に関する禁止事項
- 不要なキーや公式仕様外のフィールド追加
- 必須フィールドの省略
- ノード名・IDの重複
- 存在しないノードへの接続

### 8.2 コードに関する禁止事項
- n8n Expression Language外の構文使用
- eval()等の危険な関数の使用
- 無限ループの可能性があるコード
- 未対応のES機能（ES2022以降等）

### 8.3 セキュリティに関する禁止事項
- APIキー・パスワードの直接記述
- SQLインジェクション脆弱性のあるクエリ
- XSS脆弱性のある出力
- 不適切なCORS設定

---

## 9. トラブルシューティング

### 9.1 よくあるエラーと対処法

| エラー | 原因 | 対処法 |
|:------|:-----|:-------|
| "Unknown node type" | typeVersionが古いか存在しない | 最新版を確認して更新 |
| "Node not found" | connections内の参照先が存在しない | ノード名を確認・修正 |
| "Invalid expression" | 式の構文エラー | n8n Expression記法を確認 |
| "Credential not found" | 認証情報IDが間違っている | n8nで正しいIDを確認 |

### 9.2 デバッグ手法
1. **エディタでのテスト実行**: 各ノードを個別に実行して確認
2. **式のプレビュー**: エディタの式プレビュー機能を活用
3. **ログ出力**: Functionノードで`console.log()`使用
4. **エラーワークフロー**: 専用のエラーハンドリングワークフローを設定

---

## 10. 参考リンク

* [n8n公式ドキュメント](https://docs.n8n.io/)
* [n8nノードリファレンス](https://docs.n8n.io/nodes/)
* [n8n Expression Language](https://docs.n8n.io/code/expressions/)
* [n8n Community Forum](https://community.n8n.io/)
* [n8n GitHub](https://github.com/n8n-io/n8n)
* [n8n Workflows MCP Server](https://n8n.io/workflows/3770-build-your-own-n8n-workflows-mcp-server/)
* [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io/)

---

## 11. 改訂履歴

| バージョン | 日付 | 変更内容 |
|:----------|:-----|:---------|
| 1.0.1 | 2025年7月 | MCPサーバー統合セクション追加 |
| 1.0.0 | 2025年7月 | 初版作成 |

---

**本workflow.mdは、n8nワークフロー作成時の「唯一の準拠ガイド」として必ず参照すること。**  
**AI・人間を問わず、本ガイドラインに準拠しない成果物は受け入れられない。**