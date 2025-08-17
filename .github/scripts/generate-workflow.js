#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Claude APIを使用してn8nワークフローを生成するスクリプト
 */

// 環境変数から必要な情報を取得
const API_KEY = process.env.ANTHROPIC_API_KEY;
const PR_BODY = process.env.PR_BODY || '';
const FILE_CONTENT = process.env.FILE_CONTENT || '{}';
const GENERATION_MODE = process.env.GENERATION_MODE || 'from_workflow';
const SPEC_FILE = process.env.SPEC_FILE || '';

if (!API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY is not set');
  process.exit(1);
}

// システムプロンプト（n8nワークフロー生成のエキスパートとして振る舞う）
const SYSTEM_PROMPT = `You are an expert n8n Workflow Automation System v1.30.0. Your sole purpose is to generate and correct n8n workflow JSON based on user requests.

**Critical Rules:**
1. Your response MUST be a single, valid JSON object. Do not include any explanatory text, markdown formatting like \`\`\`json, or any preamble. Your response must start with { and end with }.
2. The generated JSON must be a complete n8n workflow with the following structure:
   - name: workflow name (required)
   - nodes: array of node objects
   - connections: object mapping node connections
   - settings: workflow settings object with executionOrder, saveExecutionProgress, saveDataSuccessExecution (STRING "all" or "none"), saveDataErrorExecution (STRING "all" or "none")
   - meta: optional metadata object
   - pinData: optional pinned data object (usually empty {})

3. All nodes must have:
   - unique id (UUID format preferred)
   - name (descriptive string)
   - type (valid n8n node type from the list below)
   - position array [x, y]
   - parameters object (node-specific configuration)
   - typeVersion number (use the exact version specified below)

4. **ONLY use these exact node types (anything else will fail):**
   
   TRIGGER NODES (at least one required):
   - n8n-nodes-base.webhook (v1.1)
   - n8n-nodes-base.scheduleTrigger (v1.1)
   - n8n-nodes-base.manualTrigger (v1)
   - n8n-nodes-base.emailReadImapV2 (v2)
   
   CORE NODES:
   - n8n-nodes-base.set (v3.3) - Use new format with assignments.assignments array
   - n8n-nodes-base.code (v2) - JavaScript execution
   - n8n-nodes-base.httpRequest (v4.1) - HTTP/API calls
   - n8n-nodes-base.if (v2) - Conditional branching
   - n8n-nodes-base.switch (v3) - Multiple conditions
   - n8n-nodes-base.merge (v3) - Merge data
   - n8n-nodes-base.splitInBatches (v3) - Batch processing
   
   AI/LLM NODES (langchain package):
   - @n8n/n8n-nodes-langchain.agent (v1) - AI Agent
   - @n8n/n8n-nodes-langchain.lmChatOpenAi (v1) - OpenAI Chat
   - @n8n/n8n-nodes-langchain.toolCode (v1) - Tool for agents
   - @n8n/n8n-nodes-langchain.memoryBufferWindow (v1) - Conversation memory
   
   INTEGRATION NODES:
   - n8n-nodes-base.slack (v2.1)
   - n8n-nodes-base.discord (v2)
   - n8n-nodes-base.postgres (v2.4)
   - n8n-nodes-base.googleSheets (v4)

5. **NEVER use these (they don't exist):**
   - n8n-nodes-base.openai (use @n8n/n8n-nodes-langchain.lmChatOpenAi instead)
   - n8n-nodes-base.gpt (use @n8n/n8n-nodes-langchain.agent instead)
   - Short names like 'webhook', 'code', 'http' (always use full names)

6. Connection format MUST be:
   {
     "NodeName": {
       "main": [[{"node": "TargetNodeName", "type": "main", "index": 0}]]
     }
   }
   
   For AI nodes connecting to Agent:
   {
     "OpenAI Chat": {
       "ai_languageModel": [[{"node": "Agent", "type": "ai_languageModel", "index": 0}]]
     }
   }

7. Analyze the user's intent carefully to create a logical and functional workflow
7. IMPORTANT: saveDataSuccessExecution and saveDataErrorExecution MUST be strings ("all" or "none"), NOT booleans`;

// ユーザープロンプトを構築
function buildUserPrompt() {
  let prompt = '';
  
  if (GENERATION_MODE === 'from_spec' && SPEC_FILE) {
    // スペックファイルから新規生成
    const specContent = fs.readFileSync(SPEC_FILE, 'utf8');
    prompt = `
<task>
Generate a complete n8n workflow based on the following specification.
</task>

<specification>
${specContent}
</specification>

<pr_context>
${PR_BODY}
</pr_context>

<instructions>
- Create a fully functional n8n workflow that implements the specification
- Ensure all nodes have unique IDs (use UUID format)
- Connect the nodes logically based on the workflow requirements
- Include proper error handling where appropriate
- Your response MUST be only the raw JSON object, starting with { and ending with }
</instructions>`;
  } else {
    // 既存ワークフローの修正/改善
    prompt = `
<task>
Please generate a complete and valid n8n workflow based on the following intent and existing JSON. If the existing JSON is buggy or incomplete, correct it based on the intent.
</task>

<intent>
${PR_BODY}
</intent>

<current_workflow_json>
${FILE_CONTENT}
</current_workflow_json>

<instructions>
- If the JSON is invalid or incomplete, fix all issues
- Ensure all nodes have unique IDs
- Ensure all connections reference valid nodes
- Verify settings object has correct string values for saveDataSuccessExecution and saveDataErrorExecution
- Connect the nodes logically based on the intent
- Your response MUST be only the raw JSON object, starting with { and ending with }
</instructions>`;
  }
  
  return prompt;
}

// Claude APIを呼び出す関数
function callClaudeAPI(userPrompt) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: 'claude-3-sonnet-20241022',
      max_tokens: 8192,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            console.error('API Error:', response.error);
            reject(new Error(response.error.message || 'API Error'));
            return;
          }

          if (response.content && response.content[0] && response.content[0].text) {
            resolve(response.content[0].text);
          } else {
            reject(new Error('Unexpected API response structure'));
          }
        } catch (error) {
          console.error('Failed to parse API response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}

// メイン処理
async function main() {
  try {
    console.log('Generating n8n workflow with Claude API...');
    console.log('Mode:', GENERATION_MODE);
    
    const userPrompt = buildUserPrompt();
    const generatedJSON = await callClaudeAPI(userPrompt);
    
    // 生成されたJSONを検証
    let parsedJSON;
    try {
      parsedJSON = JSON.parse(generatedJSON);
    } catch (error) {
      console.error('Failed to parse generated JSON:', error);
      console.error('Generated content:', generatedJSON.substring(0, 500));
      process.exit(1);
    }
    
    // 基本的な構造検証
    if (!parsedJSON.nodes || !Array.isArray(parsedJSON.nodes)) {
      console.error('Invalid workflow structure: missing or invalid nodes array');
      process.exit(1);
    }
    
    if (!parsedJSON.connections || typeof parsedJSON.connections !== 'object') {
      console.error('Invalid workflow structure: missing or invalid connections object');
      process.exit(1);
    }
    
    if (!parsedJSON.settings || typeof parsedJSON.settings !== 'object') {
      console.error('Invalid workflow structure: missing or invalid settings object');
      process.exit(1);
    }
    
    // settingsの値が文字列であることを確認
    if (typeof parsedJSON.settings.saveDataSuccessExecution !== 'string') {
      console.error('Invalid settings: saveDataSuccessExecution must be a string');
      process.exit(1);
    }
    
    if (typeof parsedJSON.settings.saveDataErrorExecution !== 'string') {
      console.error('Invalid settings: saveDataErrorExecution must be a string');
      process.exit(1);
    }
    
    // 生成されたJSONを出力（GitHub ActionsのOUTPUT用）
    const outputJSON = JSON.stringify(parsedJSON);
    console.log(`::set-output name=json_output::${outputJSON}`);
    
    // ファイルにも保存（デバッグ用）
    fs.writeFileSync('generated_workflow.json', JSON.stringify(parsedJSON, null, 2));
    console.log('✅ Workflow generated successfully');
    
  } catch (error) {
    console.error('Error generating workflow:', error);
    process.exit(1);
  }
}

// スクリプトを実行
main();