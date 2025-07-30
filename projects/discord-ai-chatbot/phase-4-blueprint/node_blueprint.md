# Discord AI ChatBot ノード詳細設計

## ノード構成

### 1. Webhook (トリガー)
- **ノード名**: Webhook
- **タイプ**: n8n-nodes-base.webhook
- **説明**: Discordからのメンションイベントを受信
- **設定**:
  ```json
  {
    "httpMethod": "POST",
    "path": "discord-bot-webhook",
    "responseMode": "onReceived",
    "responseData": "firstEntryJson"
  }
  ```

### 2. Function (データ処理)
- **ノード名**: Parse Discord Message
- **タイプ**: n8n-nodes-base.function
- **説明**: Discordメッセージを解析してメンションチェック
- **コード**:
  ```javascript
  // Discordからのデータを解析
  const discordData = $input.first().json;
  
  // メンションチェック
  const botId = "{{YOUR_BOT_ID}}";
  const mentions = discordData.mentions || [];
  const isBotMentioned = mentions.some(mention => mention.id === botId);
  
  if (!isBotMentioned) {
    throw new Error("Bot was not mentioned");
  }
  
  // メッセージからメンションを除去
  const content = discordData.content.replace(/<@!?\d+>/g, '').trim();
  
  return {
    json: {
      content: content,
      channelId: discordData.channel_id,
      authorId: discordData.author.id,
      authorName: discordData.author.username,
      messageId: discordData.id
    }
  };
  ```

### 3. AI Agent
- **ノード名**: AI Agent
- **タイプ**: nodes-langchain.agent
- **説明**: GPT-4o-miniで応答を生成
- **設定**:
  ```json
  {
    "promptType": "define",
    "text": "{{ $json.content }}",
    "hasOutputParser": false
  }
  ```

### 4. OpenAI Chat Model
- **ノード名**: OpenAI Chat Model
- **タイプ**: nodes-langchain.lmChatOpenAi
- **説明**: AI Agent用のGPT-4o-mini設定
- **設定**:
  ```json
  {
    "model": "gpt-4o-mini",
    "options": {
      "temperature": 0.7,
      "maxTokens": 1000
    }
  }
  ```
- **接続**: AI Agentのai_model入力に接続

### 5. Discord
- **ノード名**: Send Discord Message
- **タイプ**: n8n-nodes-base.discord
- **説明**: 生成された応答をDiscordに送信
- **設定**:
  ```json
  {
    "authentication": "botToken",
    "resource": "message",
    "operation": "send",
    "guildId": "={{ $('Parse Discord Message').item.json.guildId }}",
    "channelId": "={{ $('Parse Discord Message').item.json.channelId }}",
    "message": "<@{{ $('Parse Discord Message').item.json.authorId }}> {{ $json.output }}",
    "options": {
      "message_reference": {
        "message_id": "={{ $('Parse Discord Message').item.json.messageId }}"
      }
    }
  }
  ```

## ノード接続関係
1. Webhook → Parse Discord Message
2. Parse Discord Message → AI Agent
3. AI Agent ← OpenAI Chat Model (ai_model接続)
4. AI Agent → Send Discord Message

## エラーハンドリング
- Function内でメンションチェック失敗時はエラースロー
- AI Agent失敗時は代替メッセージ送信を検討
- Discord送信失敗時は再試行設定