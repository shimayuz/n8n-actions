#!/usr/bin/env node

/**
 * Workflow Scanner
 * Scans for new or modified n8n workflow files and compares with sync state
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const { promisify } = require('util');

const globAsync = promisify(glob);

// Default configuration
const DEFAULT_CONFIG = {
  stateFile: '.workflow-sync-state.json',
  scanPatterns: [
    'projects/*/phase-12-final/*.json',
    'projects/*/phase-7-final/*.json',
    'projects/*/phase-8-deployment/*.json'
  ],
  excludePatterns: [
    '**/node_modules/**',
    '**/.git/**',
    '**/backup/**',
    '**/*-draft.json',
    '**/*-test.json'
  ]
};

class WorkflowScanner {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = null;
  }

  async loadState() {
    try {
      const stateContent = await fs.readFile(this.config.stateFile, 'utf8');
      this.state = JSON.parse(stateContent);
    } catch (error) {
      // Initialize empty state if file doesn't exist
      this.state = {
        processed_workflows: {},
        last_sync: null,
        metrics: {
          total_processed: 0,
          total_synced: 0,
          total_failed: 0
        }
      };
    }
    return this.state;
  }

  async saveState() {
    await fs.writeFile(
      this.config.stateFile,
      JSON.stringify(this.state, null, 2),
      'utf8'
    );
  }

  async scanForWorkflows() {
    const allWorkflows = new Set();

    // Scan each pattern
    for (const pattern of this.config.scanPatterns) {
      const files = await globAsync(pattern, {
        ignore: this.config.excludePatterns
      });
      files.forEach(file => allWorkflows.add(file));
    }

    return Array.from(allWorkflows);
  }

  async getWorkflowMetadata(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const workflow = JSON.parse(content);
      const stats = await fs.stat(filePath);

      return {
        path: filePath,
        name: workflow.name || 'Unnamed Workflow',
        id: workflow.id || null,
        nodeCount: workflow.nodes ? workflow.nodes.length : 0,
        description: workflow.description || '',
        modifiedTime: stats.mtime,
        size: stats.size
      };
    } catch (error) {
      console.error(`Error reading workflow ${filePath}:`, error.message);
      return null;
    }
  }

  async findNewWorkflows() {
    await this.loadState();
    const allWorkflows = await this.scanForWorkflows();
    const newWorkflows = [];
    const modifiedWorkflows = [];

    for (const workflowPath of allWorkflows) {
      const metadata = await this.getWorkflowMetadata(workflowPath);
      if (!metadata) continue;

      const processedInfo = this.state.processed_workflows[workflowPath];

      if (!processedInfo) {
        // New workflow
        newWorkflows.push(metadata);
      } else {
        // Check if modified
        const lastProcessed = new Date(processedInfo.processed_at);
        if (metadata.modifiedTime > lastProcessed) {
          modifiedWorkflows.push(metadata);
        }
      }
    }

    return {
      new: newWorkflows,
      modified: modifiedWorkflows,
      total: allWorkflows.length
    };
  }

  async markAsProcessed(workflowPath, status = 'success') {
    this.state.processed_workflows[workflowPath] = {
      processed_at: new Date().toISOString(),
      status: status,
      last_sync: status === 'success' ? new Date().toISOString() : null
    };

    // Update metrics
    this.state.metrics.total_processed++;
    if (status === 'success') {
      this.state.metrics.total_synced++;
    } else {
      this.state.metrics.total_failed++;
    }

    this.state.last_sync = new Date().toISOString();
    await this.saveState();
  }

  async generateReport(scanResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_workflows: scanResults.total,
        new_workflows: scanResults.new.length,
        modified_workflows: scanResults.modified.length,
        action_required: scanResults.new.length + scanResults.modified.length
      },
      new_workflows: scanResults.new.map(w => ({
        path: w.path,
        name: w.name,
        nodes: w.nodeCount
      })),
      modified_workflows: scanResults.modified.map(w => ({
        path: w.path,
        name: w.name,
        nodes: w.nodeCount,
        last_modified: w.modifiedTime
      })),
      state_metrics: this.state.metrics
    };

    return report;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'scan';

  const scanner = new WorkflowScanner();

  try {
    switch (command) {
      case 'scan':
        const results = await scanner.findNewWorkflows();
        const report = await scanner.generateReport(results);
        console.log(JSON.stringify(report, null, 2));
        break;

      case 'mark-processed':
        const workflowPath = args[1];
        const status = args[2] || 'success';
        if (!workflowPath) {
          console.error('Usage: workflow-scanner.js mark-processed <path> [status]');
          process.exit(1);
        }
        await scanner.markAsProcessed(workflowPath, status);
        console.log(`Marked ${workflowPath} as processed with status: ${status}`);
        break;

      case 'reset':
        scanner.state = {
          processed_workflows: {},
          last_sync: null,
          metrics: {
            total_processed: 0,
            total_synced: 0,
            total_failed: 0
          }
        };
        await scanner.saveState();
        console.log('State reset successfully');
        break;

      case 'list':
        await scanner.loadState();
        const processed = Object.keys(scanner.state.processed_workflows);
        console.log(`Total processed workflows: ${processed.length}`);
        processed.forEach(p => {
          const info = scanner.state.processed_workflows[p];
          console.log(`- ${p}: ${info.status} (${info.processed_at})`);
        });
        break;

      default:
        console.log('Usage: workflow-scanner.js [scan|mark-processed|reset|list]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = WorkflowScanner;

// Run CLI if called directly
if (require.main === module) {
  main();
}