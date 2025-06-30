#!/usr/bin/env node

/**
 * Validate n8n workflow JSON files
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
    workflow.nodes.forEach((node, index) => {
      if (!node.id) {
        errors.push(`Node at index ${index} missing required field: id`);
      }
      if (!node.name) {
        errors.push(`Node at index ${index} missing required field: name`);
      }
      if (!node.type) {
        errors.push(`Node at index ${index} missing required field: type`);
      }
      if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
        errors.push(`Node "${node.name || index}" has invalid position`);
      }
    });
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