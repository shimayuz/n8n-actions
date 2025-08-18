#!/usr/bin/env node

/**
 * n8n Workflow ID Helper
 * 
 * This script helps manage workflow IDs between GitHub and n8n instances.
 * It can:
 * - List all workflows with their IDs
 * - Extract workflow ID from n8n URL
 * - Update workflow metadata with n8n ID
 * - Find workflow by various identifiers
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  n8nApiUrl: process.env.N8N_API_URL || 'https://your-n8n-instance.com/api/v1',
  n8nApiKey: process.env.N8N_API_KEY || '',
  workflowsDir: path.join(__dirname, '..', 'workflows'),
  projectsDir: path.join(__dirname, '..', 'projects')
};

/**
 * Extract workflow ID from n8n URL
 * @param {string} url - n8n workflow URL
 * @returns {string|null} - Workflow ID or null
 */
function extractIdFromUrl(url) {
  const match = url.match(/\/workflow\/([a-zA-Z0-9]+)(?:\/|$)/);
  return match ? match[1] : null;
}

/**
 * Get all workflow files from the repository
 * @returns {Array} - Array of workflow file paths
 */
function getAllWorkflowFiles() {
  const files = [];
  
  // Check workflows directory
  if (fs.existsSync(CONFIG.workflowsDir)) {
    const workflowFiles = fs.readdirSync(CONFIG.workflowsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(CONFIG.workflowsDir, file));
    files.push(...workflowFiles);
  }
  
  // Check projects directory for workflow files
  if (fs.existsSync(CONFIG.projectsDir)) {
    const projectDirs = fs.readdirSync(CONFIG.projectsDir)
      .map(dir => path.join(CONFIG.projectsDir, dir))
      .filter(dir => fs.statSync(dir).isDirectory());
    
    for (const projectDir of projectDirs) {
      const projectFiles = fs.readdirSync(projectDir)
        .filter(file => file.endsWith('.json') && !file.includes('.meta'))
        .map(file => path.join(projectDir, file));
      files.push(...projectFiles);
    }
  }
  
  return files;
}

/**
 * Read workflow metadata from file
 * @param {string} filePath - Path to workflow JSON file
 * @returns {Object|null} - Workflow data or null
 */
function readWorkflowFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Update workflow metadata
 * @param {string} filePath - Path to workflow JSON file
 * @param {Object} metadata - Metadata to add/update
 */
function updateWorkflowMetadata(filePath, metadata) {
  try {
    const workflow = readWorkflowFile(filePath);
    if (!workflow) return false;
    
    // Initialize meta field if it doesn't exist
    if (!workflow.meta) {
      workflow.meta = {};
    }
    
    // Update metadata
    workflow.meta = {
      ...workflow.meta,
      ...metadata,
      lastUpdated: new Date().toISOString()
    };
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
    console.log(`✅ Updated metadata for ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return false;
  }
}

/**
 * List all workflows with their IDs
 */
function listWorkflows() {
  console.log('\n📋 Workflow ID Registry\n');
  console.log('='.repeat(80));
  
  const files = getAllWorkflowFiles();
  const workflows = [];
  
  for (const file of files) {
    const workflow = readWorkflowFile(file);
    if (workflow) {
      workflows.push({
        name: workflow.name || 'Unnamed',
        file: path.relative(process.cwd(), file),
        n8nId: workflow.meta?.n8nWorkflowId || 'Not set',
        githubPR: workflow.meta?.githubPullRequest || 'N/A',
        lastUpdated: workflow.meta?.lastUpdated || 'Unknown'
      });
    }
  }
  
  // Display in table format
  console.log('Name'.padEnd(30) + ' | ' + 'n8n ID'.padEnd(15) + ' | ' + 'File Path');
  console.log('-'.repeat(80));
  
  workflows.forEach(w => {
    const name = w.name.length > 29 ? w.name.substring(0, 26) + '...' : w.name;
    console.log(
      name.padEnd(30) + ' | ' +
      w.n8nId.padEnd(15) + ' | ' +
      w.file
    );
  });
  
  console.log('\n📊 Summary:');
  console.log(`  Total workflows: ${workflows.length}`);
  console.log(`  With n8n ID: ${workflows.filter(w => w.n8nId !== 'Not set').length}`);
  console.log(`  Missing ID: ${workflows.filter(w => w.n8nId === 'Not set').length}`);
}

/**
 * Find workflow by various identifiers
 * @param {string} identifier - Workflow ID, name, or file path
 */
function findWorkflow(identifier) {
  const files = getAllWorkflowFiles();
  const matches = [];
  
  for (const file of files) {
    const workflow = readWorkflowFile(file);
    if (!workflow) continue;
    
    // Check various fields
    if (
      workflow.name?.toLowerCase().includes(identifier.toLowerCase()) ||
      workflow.meta?.n8nWorkflowId === identifier ||
      file.includes(identifier) ||
      workflow.meta?.githubPullRequest === identifier
    ) {
      matches.push({
        file,
        workflow
      });
    }
  }
  
  if (matches.length === 0) {
    console.log(`❌ No workflow found matching: ${identifier}`);
    return;
  }
  
  console.log(`\n🔍 Found ${matches.length} matching workflow(s):\n`);
  
  matches.forEach(({ file, workflow }) => {
    console.log('─'.repeat(60));
    console.log(`📄 File: ${path.relative(process.cwd(), file)}`);
    console.log(`📝 Name: ${workflow.name}`);
    console.log(`🆔 n8n ID: ${workflow.meta?.n8nWorkflowId || 'Not set'}`);
    console.log(`🔗 GitHub PR: ${workflow.meta?.githubPullRequest || 'N/A'}`);
    console.log(`📅 Last Updated: ${workflow.meta?.lastUpdated || 'Unknown'}`);
    
    if (workflow.meta?.deployedUrl) {
      console.log(`🌐 Deployed URL: ${workflow.meta.deployedUrl}`);
    }
    
    if (workflow.meta?.description) {
      console.log(`📖 Description: ${workflow.meta.description}`);
    }
  });
}

/**
 * Interactive prompt to update workflow ID
 * @param {string} filePath - Path to workflow file
 * @param {string} n8nId - n8n workflow ID
 */
function setWorkflowId(filePath, n8nId) {
  // Handle URL input
  if (n8nId.includes('http')) {
    const extractedId = extractIdFromUrl(n8nId);
    if (extractedId) {
      n8nId = extractedId;
      console.log(`📎 Extracted ID from URL: ${n8nId}`);
    } else {
      console.error('❌ Could not extract workflow ID from URL');
      return;
    }
  }
  
  // Find the workflow file
  const files = getAllWorkflowFiles();
  let targetFile = null;
  
  // Check if filePath is absolute or relative
  if (fs.existsSync(filePath)) {
    targetFile = filePath;
  } else {
    // Search for matching file
    for (const file of files) {
      if (file.includes(filePath)) {
        targetFile = file;
        break;
      }
    }
  }
  
  if (!targetFile) {
    console.error(`❌ Workflow file not found: ${filePath}`);
    return;
  }
  
  // Update metadata
  const success = updateWorkflowMetadata(targetFile, {
    n8nWorkflowId: n8nId,
    deployedUrl: `${CONFIG.n8nApiUrl.replace('/api/v1', '')}/workflow/${n8nId}`
  });
  
  if (success) {
    console.log(`\n✨ Successfully set workflow ID for ${path.basename(targetFile)}`);
    console.log(`   n8n ID: ${n8nId}`);
  }
}

/**
 * Main CLI interface
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('\n🔧 n8n Workflow ID Helper\n');
  
  switch (command) {
    case 'list':
      listWorkflows();
      break;
      
    case 'find':
      if (!args[1]) {
        console.error('❌ Please provide a search term');
        console.log('Usage: node workflow-id-helper.js find <id|name|file>');
        return;
      }
      findWorkflow(args[1]);
      break;
      
    case 'set':
      if (!args[1] || !args[2]) {
        console.error('❌ Please provide file path and workflow ID');
        console.log('Usage: node workflow-id-helper.js set <file> <n8n-id-or-url>');
        return;
      }
      setWorkflowId(args[1], args[2]);
      break;
      
    case 'extract':
      if (!args[1]) {
        console.error('❌ Please provide an n8n URL');
        console.log('Usage: node workflow-id-helper.js extract <n8n-url>');
        return;
      }
      const id = extractIdFromUrl(args[1]);
      if (id) {
        console.log(`✅ Extracted ID: ${id}`);
      } else {
        console.log('❌ Could not extract ID from URL');
      }
      break;
      
    default:
      console.log(`
📚 Available Commands:

  list                    - List all workflows with their IDs
  find <search>          - Find workflow by ID, name, or file path
  set <file> <id>        - Set n8n workflow ID for a file
  extract <url>          - Extract workflow ID from n8n URL

📌 Examples:

  node workflow-id-helper.js list
  node workflow-id-helper.js find "customer-onboarding"
  node workflow-id-helper.js set workflows/my-workflow.json abCDE1f6gHiJKL7
  node workflow-id-helper.js set my-workflow.json https://n8n.io/workflow/abCDE1f6gHiJKL7
  node workflow-id-helper.js extract https://n8n.io/workflow/abCDE1f6gHiJKL7

💡 Tips:

  - You can use partial file names when searching
  - The 'set' command accepts both IDs and URLs
  - Workflow IDs are found in the n8n URL when viewing a workflow
      `);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export functions for use in other scripts
module.exports = {
  extractIdFromUrl,
  getAllWorkflowFiles,
  readWorkflowFile,
  updateWorkflowMetadata,
  listWorkflows,
  findWorkflow,
  setWorkflowId
};