#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Claude APIを使用してn8nワークフローのエラーを自己修正するスクリプト
 */

// 環境変数から必要な情報を取得
const API_KEY = process.env.ANTHROPIC_API_KEY;
const PR_BODY = process.env.PR_BODY || '';
const LAST_ERROR_MESSAGE = process.env.LAST_ERROR_MESSAGE || '';

if (!API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY is not set');
  process.exit(1);
}

// エラー修正用のシステムプロンプト
const SYSTEM_PROMPT = `You are an expert n8n Workflow Debugging and Correction System. Your sole purpose is to analyze workflow errors and fix them.

**Critical Rules:**
1. Your response MUST be a single, valid JSON object. Do not include any explanatory text, markdown formatting, or any preamble.
2. Carefully analyze the error message to understand what went wrong
3. Common n8n workflow errors include:
   - Missing or duplicate node IDs
   - Invalid node references in connections
   - Incorrect parameter types or missing required parameters
   - Invalid settings values (remember: saveDataSuccessExecution and saveDataErrorExecution MUST be strings)
   - Malformed JSON structure
4. Fix ONLY the specific error mentioned while preserving the rest of the workflow logic
5. Do not introduce new errors while fixing existing ones
6. Ensure the corrected workflow maintains the original intent`;

// 前回生成されたワークフローを読み込む
function loadPreviousWorkflow() {
  try {
    const content = fs.readFileSync('generated_workflow.json', 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load previous workflow:', error);
    return null;
  }
}

// エラーログを解析してエラーの種類を特定
function analyzeError(errorMessage) {
  const errorPatterns = {
    duplicateId: /duplicate.*id/i,
    missingNode: /node.*not.*found|cannot.*find.*node/i,
    invalidConnection: /invalid.*connection|connection.*error/i,
    missingParameter: /missing.*required.*parameter|parameter.*required/i,
    invalidType: /invalid.*type|type.*error/i,
    syntaxError: /syntax.*error|unexpected.*token/i,
    settingsError: /settings.*must.*be.*string|saveData.*must.*be.*string/i
  };

  for (const [errorType, pattern] of Object.entries(errorPatterns)) {
    if (pattern.test(errorMessage)) {
      return errorType;
    }
  }
  
  return 'unknown';
}

// 修正用プロンプトを構築
function buildCorrectionPrompt(previousWorkflow, errorMessage) {
  const errorType = analyzeError(errorMessage);
  
  return `
<task>
The n8n workflow has an error that needs to be fixed. Analyze the error and correct the JSON.
</task>

<original_intent>
${PR_BODY}
</original_intent>

<faulty_workflow_json>
${JSON.stringify(previousWorkflow, null, 2)}
</faulty_workflow_json>

<validation_error>
Error Type: ${errorType}
Error Message: ${errorMessage}
</validation_error>

<specific_instructions>
${getSpecificInstructions(errorType)}
</specific_instructions>

<general_instructions>
- Carefully analyze the error message to understand the exact problem
- Fix ONLY the specific error mentioned
- Preserve all other aspects of the workflow that are working
- Ensure the workflow still achieves the original intent
- Your response MUST be only the corrected, raw JSON object
</general_instructions>`;
}

// エラータイプに応じた具体的な修正指示を取得
function getSpecificInstructions(errorType) {
  const instructions = {
    duplicateId: `
- Check all node IDs and ensure each one is unique
- Generate new UUIDs for any duplicate IDs found
- Update any connections that reference the changed IDs`,
    
    missingNode: `
- Identify which node ID is being referenced but doesn't exist
- Either create the missing node or fix the reference to point to an existing node
- Ensure all connection references are valid`,
    
    invalidConnection: `
- Check the connections object structure
- Ensure all node names in connections exist in the nodes array
- Verify connection points (main, ai_tool, etc.) are valid for the node types`,
    
    missingParameter: `
- Identify which node is missing required parameters
- Add the missing required parameters with appropriate default values
- Refer to n8n documentation for the specific node type's requirements`,
    
    invalidType: `
- Check data types of all parameters
- Remember: saveDataSuccessExecution and saveDataErrorExecution must be strings ("all" or "none")
- Ensure boolean values are not quoted and string values are properly quoted`,
    
    syntaxError: `
- Fix any JSON syntax errors (missing commas, brackets, quotes)
- Ensure proper JSON structure throughout
- Validate that all strings are properly escaped`,
    
    settingsError: `
- Ensure settings.saveDataSuccessExecution is a string ("all" or "none"), not a boolean
- Ensure settings.saveDataErrorExecution is a string ("all" or "none"), not a boolean
- Check that executionOrder is set to "v1"
- Verify saveExecutionProgress is a boolean (true or false)`,
    
    unknown: `
- Read the error message carefully
- Identify the specific issue mentioned
- Apply appropriate fixes based on n8n workflow requirements`
  };
  
  return instructions[errorType] || instructions.unknown;
}

// Claude APIを呼び出す関数
function callClaudeAPI(userPrompt) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: 'claude-3-sonnet-20241022',
      max_tokens: 8192,
      temperature: 0.1, // より確定的な出力のため低めに設定
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
    console.log('Starting self-correction process...');
    
    // 前回のワークフローを読み込む
    const previousWorkflow = loadPreviousWorkflow();
    if (!previousWorkflow) {
      console.error('Cannot load previous workflow for correction');
      process.exit(1);
    }
    
    // エラーメッセージを取得（環境変数またはファイルから）
    let errorMessage = LAST_ERROR_MESSAGE;
    if (!errorMessage && fs.existsSync('validation_error.txt')) {
      errorMessage = fs.readFileSync('validation_error.txt', 'utf8');
    }
    
    if (!errorMessage) {
      console.error('No error message available for correction');
      process.exit(1);
    }
    
    console.log('Error to fix:', errorMessage);
    console.log('Error type:', analyzeError(errorMessage));
    
    // 修正プロンプトを構築
    const correctionPrompt = buildCorrectionPrompt(previousWorkflow, errorMessage);
    
    // Claude APIを呼び出して修正
    console.log('Calling Claude API for correction...');
    const correctedJSON = await callClaudeAPI(correctionPrompt);
    
    // 修正されたJSONを検証
    let parsedJSON;
    try {
      parsedJSON = JSON.parse(correctedJSON);
    } catch (error) {
      console.error('Failed to parse corrected JSON:', error);
      console.error('Corrected content:', correctedJSON.substring(0, 500));
      process.exit(1);
    }
    
    // 基本的な構造検証
    if (!parsedJSON.nodes || !Array.isArray(parsedJSON.nodes)) {
      console.error('Invalid corrected structure: missing or invalid nodes array');
      process.exit(1);
    }
    
    if (!parsedJSON.connections || typeof parsedJSON.connections !== 'object') {
      console.error('Invalid corrected structure: missing or invalid connections object');
      process.exit(1);
    }
    
    if (!parsedJSON.settings || typeof parsedJSON.settings !== 'object') {
      console.error('Invalid corrected structure: missing or invalid settings object');
      process.exit(1);
    }
    
    // 修正されたJSONを保存
    fs.writeFileSync('corrected_workflow.json', JSON.stringify(parsedJSON, null, 2));
    console.log('✅ Workflow corrected and saved to corrected_workflow.json');
    
    // GitHub ActionsのOUTPUT用
    const outputJSON = JSON.stringify(parsedJSON);
    console.log(`::set-output name=corrected_json::${outputJSON}`);
    
  } catch (error) {
    console.error('Error during correction:', error);
    process.exit(1);
  }
}

// スクリプトを実行
main();