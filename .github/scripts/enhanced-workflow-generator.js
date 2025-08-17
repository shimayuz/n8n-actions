#!/usr/bin/env node

/**
 * Enhanced n8n Workflow Generator with Multi-Model Support
 * Powered by Claude 3 Family (Opus, Sonnet, Haiku)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Configuration
const CONFIG = {
  api: {
    key: process.env.ANTHROPIC_API_KEY,
    endpoint: 'api.anthropic.com',
    version: '2023-06-01'
  },
  models: {
    complex: 'claude-3-opus-20240229',
    standard: 'claude-3-sonnet-20241022',
    simple: 'claude-3-haiku-20240307'
  },
  generation: {
    maxTokens: 8192,
    maxRetries: 3,
    retryDelay: 2000,
    temperature: 0.2
  }
};

// Enhanced System Prompts
const SYSTEM_PROMPTS = {
  expert: `You are an elite n8n Workflow Architect with comprehensive knowledge of:
- All n8n node types (base, langchain, community)
- Advanced workflow patterns and optimization techniques
- Error handling and recovery strategies
- Performance optimization and scaling
- Security best practices and credential management

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown, no explanations
2. Response must start with { and end with }
3. Settings must use: saveDataSuccessExecution and saveDataErrorExecution as STRINGS ("all" or "none")
4. All node IDs must be unique UUIDs
5. Implement comprehensive error handling
6. Optimize for performance and scalability
7. Follow security best practices`,

  optimizer: `You are an n8n Workflow Optimization Specialist focused on:
- Performance improvements
- Resource efficiency
- Error recovery
- Scalability patterns
- Code quality

Fix and optimize the provided workflow while maintaining functionality.`,

  validator: `You are an n8n Workflow Validation Expert responsible for:
- Structural integrity
- Security compliance
- Performance standards
- Best practice adherence
- Error prevention

Analyze and correct any issues in the workflow.`
};

// Workflow Pattern Templates
const WORKFLOW_PATTERNS = {
  'api-integration': {
    nodes: ['webhook', 'authentication', 'api-call', 'transform', 'response'],
    features: ['rate-limiting', 'retry-logic', 'error-handling']
  },
  'data-pipeline': {
    nodes: ['trigger', 'fetch', 'validate', 'transform', 'store', 'notify'],
    features: ['batch-processing', 'parallel-execution', 'checkpointing']
  },
  'ai-agent': {
    nodes: ['chat-trigger', 'context-retrieval', 'llm-processing', 'tool-calling', 'response'],
    features: ['memory-management', 'conversation-history', 'fallback-handling']
  },
  'automation': {
    nodes: ['schedule', 'condition-check', 'action', 'verification', 'logging'],
    features: ['idempotency', 'state-management', 'audit-trail']
  }
};

// Node Type Registry
const NODE_REGISTRY = {
  triggers: {
    'n8n-nodes-base.webhook': { version: 1.1, category: 'http' },
    'n8n-nodes-base.scheduleTrigger': { version: 1, category: 'time' },
    'n8n-nodes-base.emailReadImapV2': { version: 2, category: 'email' },
    '@n8n/n8n-nodes-langchain.chatTrigger': { version: 1, category: 'ai' }
  },
  processors: {
    'n8n-nodes-base.code': { version: 2, category: 'logic' },
    'n8n-nodes-base.if': { version: 1, category: 'logic' },
    'n8n-nodes-base.switch': { version: 1, category: 'logic' },
    'n8n-nodes-base.merge': { version: 2, category: 'data' }
  },
  integrations: {
    'n8n-nodes-base.discord': { version: 2, category: 'messaging' },
    'n8n-nodes-base.slack': { version: 2.1, category: 'messaging' },
    'n8n-nodes-base.postgres': { version: 2.4, category: 'database' },
    'n8n-nodes-base.httpRequest': { version: 4.1, category: 'http' }
  },
  ai: {
    '@n8n/n8n-nodes-langchain.lmChatOpenAi': { version: 1, category: 'llm' },
    '@n8n/n8n-nodes-langchain.agent': { version: 1, category: 'agent' },
    '@n8n/n8n-nodes-langchain.memoryBufferWindow': { version: 1, category: 'memory' },
    '@n8n/n8n-nodes-langchain.toolCode': { version: 1, category: 'tool' }
  }
};

// Utility Functions
class WorkflowGenerator {
  constructor(config = CONFIG) {
    this.config = config;
    this.context = {
      generatedNodes: [],
      connections: {},
      nodePositions: new Map(),
      errors: [],
      warnings: []
    };
  }

  // Generate unique node ID
  generateNodeId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Calculate node position
  calculatePosition(index, total, pattern = 'grid') {
    const layouts = {
      grid: () => {
        const cols = 4;
        const spacing = 250;
        const row = Math.floor(index / cols);
        const col = index % cols;
        return [250 + (col * spacing), 300 + (row * spacing)];
      },
      linear: () => {
        return [250 + (index * 250), 300];
      },
      tree: () => {
        const level = Math.floor(Math.log2(index + 1));
        const positionInLevel = index - (Math.pow(2, level) - 1);
        const nodesInLevel = Math.pow(2, level);
        const spacing = 800 / nodesInLevel;
        return [200 + (positionInLevel * spacing), 200 + (level * 200)];
      }
    };
    
    return layouts[pattern] ? layouts[pattern]() : layouts.grid();
  }

  // Detect workflow pattern from requirements
  detectPattern(requirements) {
    const patterns = Object.keys(WORKFLOW_PATTERNS);
    const scores = {};
    
    for (const pattern of patterns) {
      scores[pattern] = 0;
      const keywords = WORKFLOW_PATTERNS[pattern].nodes;
      
      for (const keyword of keywords) {
        if (requirements.toLowerCase().includes(keyword)) {
          scores[pattern]++;
        }
      }
    }
    
    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  }

  // Select appropriate model based on complexity
  selectModel(requirements) {
    const complexity = this.assessComplexity(requirements);
    
    if (complexity > 8) return this.config.models.complex;
    if (complexity > 4) return this.config.models.standard;
    return this.config.models.simple;
  }

  // Assess workflow complexity
  assessComplexity(requirements) {
    let score = 0;
    
    // Check for number of integrations
    const integrations = requirements.match(/integrate|connect|api|database/gi);
    score += integrations ? integrations.length : 0;
    
    // Check for advanced features
    const advanced = requirements.match(/parallel|batch|optimize|scale|security/gi);
    score += advanced ? advanced.length * 2 : 0;
    
    // Check for AI/ML features
    const ai = requirements.match(/ai|ml|llm|gpt|claude|agent/gi);
    score += ai ? ai.length * 3 : 0;
    
    return score;
  }

  // Build generation prompt
  buildPrompt(options) {
    const { mode, requirements, existingWorkflow, pattern } = options;
    
    if (mode === 'create') {
      return `
<task>Generate a complete n8n workflow</task>

<requirements>
${requirements}
</requirements>

<pattern>
${pattern ? `Use the ${pattern} pattern` : 'Detect appropriate pattern'}
</pattern>

<constraints>
- Use latest stable node versions from the registry
- Implement comprehensive error handling
- Optimize for performance
- Include proper data validation
- Follow security best practices
</constraints>

<output>Raw JSON object only</output>`;
    } else if (mode === 'enhance') {
      return `
<task>Enhance and optimize the existing workflow</task>

<current_workflow>
${JSON.stringify(existingWorkflow)}
</current_workflow>

<improvements>
${requirements}
</improvements>

<focus_areas>
- Performance optimization
- Error handling
- Security hardening
- Code quality
- Resource efficiency
</focus_areas>

<output>Enhanced workflow JSON only</output>`;
    }
  }

  // Call Claude API with retry logic
  async callClaude(prompt, model = this.config.models.standard, retries = 0) {
    return new Promise((resolve, reject) => {
      const requestBody = JSON.stringify({
        model,
        max_tokens: this.config.generation.maxTokens,
        temperature: this.config.generation.temperature,
        system: SYSTEM_PROMPTS.expert,
        messages: [{ role: 'user', content: prompt }]
      });

      const options = {
        hostname: this.config.api.endpoint,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.api.key,
          'anthropic-version': this.config.api.version,
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (response.error) {
              if (retries < this.config.generation.maxRetries) {
                console.log(`Retry ${retries + 1}/${this.config.generation.maxRetries}...`);
                setTimeout(() => {
                  this.callClaude(prompt, model, retries + 1)
                    .then(resolve)
                    .catch(reject);
                }, this.config.generation.retryDelay);
              } else {
                reject(new Error(response.error.message));
              }
              return;
            }
            
            resolve(response.content[0].text);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });
  }

  // Validate generated workflow
  validateWorkflow(workflow) {
    const errors = [];
    const warnings = [];
    
    // Check required fields
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push('Missing or invalid nodes array');
    }
    
    if (!workflow.connections || typeof workflow.connections !== 'object') {
      errors.push('Missing or invalid connections object');
    }
    
    if (!workflow.settings || typeof workflow.settings !== 'object') {
      errors.push('Missing or invalid settings object');
    }
    
    // Validate settings types
    if (workflow.settings) {
      if (typeof workflow.settings.saveDataSuccessExecution !== 'string') {
        errors.push('saveDataSuccessExecution must be a string');
      }
      if (typeof workflow.settings.saveDataErrorExecution !== 'string') {
        errors.push('saveDataErrorExecution must be a string');
      }
    }
    
    // Validate nodes
    if (workflow.nodes) {
      const nodeIds = new Set();
      const nodeNames = new Set();
      
      for (const node of workflow.nodes) {
        if (!node.id) errors.push(`Node missing ID: ${node.name}`);
        if (!node.name) errors.push(`Node missing name: ${node.id}`);
        if (!node.type) errors.push(`Node missing type: ${node.name}`);
        if (!node.position) errors.push(`Node missing position: ${node.name}`);
        
        if (nodeIds.has(node.id)) {
          errors.push(`Duplicate node ID: ${node.id}`);
        }
        nodeIds.add(node.id);
        
        if (nodeNames.has(node.name)) {
          errors.push(`Duplicate node name: ${node.name}`);
        }
        nodeNames.add(node.name);
      }
    }
    
    // Validate connections
    if (workflow.connections && workflow.nodes) {
      const nodeNameSet = new Set(workflow.nodes.map(n => n.name));
      
      for (const [source, targets] of Object.entries(workflow.connections)) {
        if (!nodeNameSet.has(source)) {
          errors.push(`Connection source node not found: ${source}`);
        }
        
        if (targets.main) {
          for (const outputConnections of targets.main) {
            for (const connection of outputConnections) {
              if (!nodeNameSet.has(connection.node)) {
                errors.push(`Connection target node not found: ${connection.node}`);
              }
            }
          }
        }
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }

  // Self-healing function
  async selfHeal(workflow, errors) {
    const fixes = {
      'Missing or invalid nodes array': () => { workflow.nodes = []; },
      'Missing or invalid connections object': () => { workflow.connections = {}; },
      'Missing or invalid settings object': () => {
        workflow.settings = {
          executionOrder: 'v1',
          saveExecutionProgress: true,
          saveDataSuccessExecution: 'all',
          saveDataErrorExecution: 'all'
        };
      },
      'saveDataSuccessExecution must be a string': () => {
        workflow.settings.saveDataSuccessExecution = 'all';
      },
      'saveDataErrorExecution must be a string': () => {
        workflow.settings.saveDataErrorExecution = 'all';
      }
    };
    
    for (const error of errors) {
      for (const [pattern, fix] of Object.entries(fixes)) {
        if (error.includes(pattern)) {
          fix();
        }
      }
    }
    
    return workflow;
  }

  // Main generation function
  async generate(options) {
    try {
      console.log('🚀 Starting enhanced workflow generation...');
      
      // Detect pattern and select model
      const pattern = this.detectPattern(options.requirements);
      const model = this.selectModel(options.requirements);
      
      console.log(`📊 Pattern detected: ${pattern}`);
      console.log(`🤖 Using model: ${model}`);
      
      // Build prompt
      const prompt = this.buildPrompt({ ...options, pattern });
      
      // Generate workflow
      console.log('⚡ Generating workflow with Claude...');
      const generatedJson = await this.callClaude(prompt, model);
      
      // Parse and validate
      let workflow = JSON.parse(generatedJson);
      let validation = this.validateWorkflow(workflow);
      
      // Self-heal if needed
      if (!validation.valid && options.autoHeal !== false) {
        console.log('🔧 Applying self-healing...');
        workflow = await this.selfHeal(workflow, validation.errors);
        validation = this.validateWorkflow(workflow);
      }
      
      // Add metadata
      workflow.meta = {
        ...workflow.meta,
        generatedBy: 'Enhanced n8n Workflow Generator',
        generatedAt: new Date().toISOString(),
        model: model,
        pattern: pattern,
        version: '2.0.0'
      };
      
      return {
        success: validation.valid,
        workflow,
        validation,
        metadata: {
          model,
          pattern,
          complexity: this.assessComplexity(options.requirements)
        }
      };
      
    } catch (error) {
      console.error('❌ Generation failed:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const generator = new WorkflowGenerator();
  
  // Parse input
  const mode = process.env.GENERATION_MODE || 'create';
  const requirements = process.env.PR_BODY || process.env.ISSUE_BODY || '';
  const existingWorkflow = process.env.FILE_CONTENT ? JSON.parse(process.env.FILE_CONTENT) : null;
  
  try {
    const result = await generator.generate({
      mode,
      requirements,
      existingWorkflow,
      autoHeal: true
    });
    
    if (result.success) {
      console.log('✅ Workflow generated successfully!');
      
      // Output for GitHub Actions
      console.log(`::set-output name=workflow::${JSON.stringify(result.workflow)}`);
      console.log(`::set-output name=success::true`);
      console.log(`::set-output name=model::${result.metadata.model}`);
      console.log(`::set-output name=pattern::${result.metadata.pattern}`);
      
      // Save to file
      await writeFile('generated_workflow.json', JSON.stringify(result.workflow, null, 2));
      
      // Generate report
      const report = {
        timestamp: new Date().toISOString(),
        success: true,
        model: result.metadata.model,
        pattern: result.metadata.pattern,
        complexity: result.metadata.complexity,
        nodeCount: result.workflow.nodes.length,
        validationWarnings: result.validation.warnings
      };
      
      await writeFile('generation_report.json', JSON.stringify(report, null, 2));
      
    } else {
      console.error('❌ Validation failed:', result.validation.errors);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    console.log(`::set-output name=success::false`);
    console.log(`::set-output name=error::${error.message}`);
    process.exit(1);
  }
}

// Export for testing
module.exports = { WorkflowGenerator, NODE_REGISTRY, WORKFLOW_PATTERNS };

// Run if called directly
if (require.main === module) {
  main();
}