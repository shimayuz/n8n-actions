#!/usr/bin/env node

/**
 * Validate n8n workflow JSON files with whitelist checking
 * Usage: node validate-workflow.js <workflow-file.json>
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Whitelist of allowed n8n nodes (実在するノードのみ)
const ALLOWED_NODES = new Set([
  // Trigger nodes
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.scheduleTrigger',
  'n8n-nodes-base.manualTrigger',
  'n8n-nodes-base.emailReadImapV2',
  
  // Core nodes
  'n8n-nodes-base.set',
  'n8n-nodes-base.code',
  'n8n-nodes-base.httpRequest',
  'n8n-nodes-base.if',
  'n8n-nodes-base.switch',
  'n8n-nodes-base.merge',
  'n8n-nodes-base.splitInBatches',
  'n8n-nodes-base.noOp',
  'n8n-nodes-base.wait',
  
  // AI/LLM nodes
  '@n8n/n8n-nodes-langchain.agent',
  '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  '@n8n/n8n-nodes-langchain.toolCode',
  '@n8n/n8n-nodes-langchain.memoryBufferWindow',
  
  // Integration nodes
  'n8n-nodes-base.slack',
  'n8n-nodes-base.discord',
  'n8n-nodes-base.postgres',
  'n8n-nodes-base.googleSheets',
  'n8n-nodes-base.gmail',
  'n8n-nodes-base.sendEmail'
]);

function validateWorkflow(filePath) {
  console.log(`${colors.blue}Validating: ${filePath}${colors.reset}\n`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`${colors.red}✗ File not found: ${filePath}${colors.reset}`);
    return false;
  }

  // Read file content
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`${colors.red}✗ Error reading file: ${error.message}${colors.reset}`);
    return false;
  }

  // Parse JSON
  let workflow;
  try {
    workflow = JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}✗ Invalid JSON: ${error.message}${colors.reset}`);
    return false;
  }

  // Validation checks
  const errors = [];
  const warnings = [];

  // Required fields
  if (!workflow.name) {
    errors.push('Missing required field: name');
  }

  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    errors.push('Missing or invalid field: nodes (must be an array)');
  } else if (workflow.nodes.length === 0) {
    warnings.push('Workflow has no nodes');
  }

  if (!workflow.connections || typeof workflow.connections !== 'object') {
    errors.push('Missing or invalid field: connections (must be an object)');
  }

  // Validate nodes
  if (workflow.nodes && Array.isArray(workflow.nodes)) {
    const nodeNames = new Set();
    
    workflow.nodes.forEach((node, index) => {
      if (!node.id) {
        errors.push(`Node at index ${index} missing required field: id`);
      }
      if (!node.name) {
        errors.push(`Node at index ${index} missing required field: name`);
      } else {
        // Check for duplicate node names
        if (nodeNames.has(node.name)) {
          errors.push(`Duplicate node name: ${node.name}`);
        }
        nodeNames.add(node.name);
      }
      if (!node.type) {
        errors.push(`Node at index ${index} missing required field: type`);
      } else {
        // Whitelist validation - check if node type exists in n8n
        if (!ALLOWED_NODES.has(node.type)) {
          errors.push(`Invalid node type: "${node.type}" (node: ${node.name || index}). This node type does not exist in n8n.`);
        }
      }
      if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
        errors.push(`Node "${node.name || index}" has invalid position`);
      }
    });
    
    // Validate connections reference existing nodes
    if (workflow.connections) {
      Object.keys(workflow.connections).forEach(sourceName => {
        if (!nodeNames.has(sourceName)) {
          errors.push(`Connection references non-existent source node: ${sourceName}`);
        }
        
        const connections = workflow.connections[sourceName];
        if (connections.main) {
          connections.main.forEach((outputConnections, outputIndex) => {
            if (Array.isArray(outputConnections)) {
              outputConnections.forEach(conn => {
                if (conn.node && !nodeNames.has(conn.node)) {
                  errors.push(`Connection from ${sourceName} references non-existent target node: ${conn.node}`);
                }
              });
            }
          });
        }
      });
    }
  }
  
  // Validate settings
  if (workflow.settings) {
    if (typeof workflow.settings.saveDataSuccessExecution !== 'undefined' && 
        typeof workflow.settings.saveDataSuccessExecution !== 'string') {
      errors.push(`settings.saveDataSuccessExecution must be a string ("all" or "none"), not ${typeof workflow.settings.saveDataSuccessExecution}`);
    }
    if (typeof workflow.settings.saveDataErrorExecution !== 'undefined' && 
        typeof workflow.settings.saveDataErrorExecution !== 'string') {
      errors.push(`settings.saveDataErrorExecution must be a string ("all" or "none"), not ${typeof workflow.settings.saveDataErrorExecution}`);
    }
  }

  // Check for credentials
  if (JSON.stringify(workflow).includes('"password"') || 
      JSON.stringify(workflow).includes('"apiKey"') ||
      JSON.stringify(workflow).includes('"token"')) {
    warnings.push('Workflow may contain credentials - please remove before committing');
  }

  // Check workflow ID
  if (!workflow.id) {
    warnings.push('Workflow missing ID - will be assigned when created in n8n');
  }

  // Display results
  if (errors.length > 0) {
    console.log(`${colors.red}Errors:${colors.reset}`);
    errors.forEach(error => console.log(`  ${colors.red}✗ ${error}${colors.reset}`));
  }

  if (warnings.length > 0) {
    console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
    warnings.forEach(warning => console.log(`  ${colors.yellow}⚠ ${warning}${colors.reset}`));
  }

  if (errors.length === 0) {
    console.log(`\n${colors.green}✓ Workflow is valid!${colors.reset}`);
    return true;
  } else {
    console.log(`\n${colors.red}✗ Workflow validation failed${colors.reset}`);
    return false;
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node validate-workflow.js <workflow-file.json>');
    console.log('Example: node validate-workflow.js workflows/my-workflow.json');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  const isValid = validateWorkflow(filePath);
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateWorkflow };