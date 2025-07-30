#!/usr/bin/env node

/**
 * Enhanced Workflow Validator for GitHub Actions
 * Validates n8n workflow JSON files with detailed reporting
 */

const fs = require('fs').promises;
const path = require('path');

// Validation rules based on workflow.md v2025.7
const VALIDATION_RULES = {
  requiredFields: ['name', 'nodes', 'connections', 'settings'],
  
  settingsRules: {
    saveDataSuccessExecution: {
      type: 'string',
      values: ['all', 'none'],
      required: true
    },
    saveDataErrorExecution: {
      type: 'string',
      values: ['all', 'none'],
      required: true
    },
    executionOrder: {
      type: 'string',
      values: ['v0', 'v1'],
      required: false
    },
    saveExecutionProgress: {
      type: 'boolean',
      required: false
    }
  },
  
  nodeRules: {
    requiredFields: ['name', 'type', 'position'],
    positionFields: ['x', 'y']
  }
};

class WorkflowValidator {
  constructor(options = {}) {
    this.options = {
      strictMode: false,
      removeCredentials: true,
      ...options
    };
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  reset() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  addError(message, path = '') {
    this.errors.push({ type: 'error', message, path });
  }

  addWarning(message, path = '') {
    this.warnings.push({ type: 'warning', message, path });
  }

  addInfo(message, path = '') {
    this.info.push({ type: 'info', message, path });
  }

  async validateFile(filePath) {
    this.reset();
    
    try {
      // Read and parse file
      const content = await fs.readFile(filePath, 'utf8');
      let workflow;
      
      try {
        workflow = JSON.parse(content);
      } catch (parseError) {
        this.addError(`Invalid JSON syntax: ${parseError.message}`);
        return this.generateReport(filePath);
      }

      // Run all validations
      this.validateStructure(workflow);
      this.validateSettings(workflow);
      this.validateNodes(workflow);
      this.validateConnections(workflow);
      this.validateSecurity(workflow);
      
      // Extract metadata
      const metadata = {
        name: workflow.name || 'Unnamed',
        nodeCount: workflow.nodes ? workflow.nodes.length : 0,
        hasCredentials: this.hasCredentials(workflow),
        workflowId: workflow.id || null
      };

      return this.generateReport(filePath, metadata);
      
    } catch (error) {
      this.addError(`Failed to read file: ${error.message}`);
      return this.generateReport(filePath);
    }
  }

  validateStructure(workflow) {
    // Check required top-level fields
    VALIDATION_RULES.requiredFields.forEach(field => {
      if (!(field in workflow)) {
        this.addError(`Missing required field: ${field}`, field);
      }
    });

    // Validate field types
    if (workflow.nodes && !Array.isArray(workflow.nodes)) {
      this.addError('Field "nodes" must be an array', 'nodes');
    }

    if (workflow.connections && typeof workflow.connections !== 'object') {
      this.addError('Field "connections" must be an object', 'connections');
    }

    if (workflow.settings && typeof workflow.settings !== 'object') {
      this.addError('Field "settings" must be an object', 'settings');
    }
  }

  validateSettings(workflow) {
    if (!workflow.settings) return;

    const settings = workflow.settings;
    
    // Validate each setting according to rules
    Object.entries(VALIDATION_RULES.settingsRules).forEach(([key, rule]) => {
      const value = settings[key];
      const path = `settings.${key}`;

      if (rule.required && value === undefined) {
        this.addError(`Missing required setting: ${key}`, path);
        return;
      }

      if (value !== undefined) {
        // Check type
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rule.type) {
          this.addError(
            `Setting "${key}" must be of type ${rule.type}, got ${actualType}`,
            path
          );
          return;
        }

        // Check allowed values
        if (rule.values && !rule.values.includes(value)) {
          this.addError(
            `Setting "${key}" must be one of: ${rule.values.join(', ')}. Got: ${value}`,
            path
          );
        }
      }
    });

    // Additional checks
    if (settings.saveDataSuccessExecution === true || settings.saveDataSuccessExecution === false) {
      this.addError(
        'saveDataSuccessExecution must be a string ("all" or "none"), not boolean',
        'settings.saveDataSuccessExecution'
      );
    }

    if (settings.saveDataErrorExecution === true || settings.saveDataErrorExecution === false) {
      this.addError(
        'saveDataErrorExecution must be a string ("all" or "none"), not boolean',
        'settings.saveDataErrorExecution'
      );
    }
  }

  validateNodes(workflow) {
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) return;

    const nodeNames = new Set();
    
    workflow.nodes.forEach((node, index) => {
      const nodePath = `nodes[${index}]`;
      
      // Check required fields
      VALIDATION_RULES.nodeRules.requiredFields.forEach(field => {
        if (!(field in node)) {
          this.addError(`Node missing required field: ${field}`, `${nodePath}.${field}`);
        }
      });

      // Check for duplicate names
      if (node.name) {
        if (nodeNames.has(node.name)) {
          this.addError(`Duplicate node name: ${node.name}`, nodePath);
        }
        nodeNames.add(node.name);
      }

      // Validate position
      if (node.position) {
        VALIDATION_RULES.nodeRules.positionFields.forEach(field => {
          if (typeof node.position[field] !== 'number') {
            this.addWarning(
              `Node position.${field} should be a number`,
              `${nodePath}.position.${field}`
            );
          }
        });
      }

      // Check for credentials
      if (node.credentials && Object.keys(node.credentials).length > 0) {
        this.addWarning(
          `Node "${node.name}" contains credentials that will be removed on import`,
          `${nodePath}.credentials`
        );
      }
    });
  }

  validateConnections(workflow) {
    if (!workflow.connections || !workflow.nodes) return;

    const nodeNames = new Set(workflow.nodes.map(n => n.name));
    
    Object.entries(workflow.connections).forEach(([sourceName, connections]) => {
      // Check if source node exists
      if (!nodeNames.has(sourceName)) {
        this.addError(
          `Connection references non-existent source node: ${sourceName}`,
          `connections.${sourceName}`
        );
      }

      // Validate connection structure
      if (typeof connections !== 'object') {
        this.addError(
          `Invalid connection structure for node: ${sourceName}`,
          `connections.${sourceName}`
        );
        return;
      }

      // Check target nodes
      Object.values(connections).forEach(outputConnections => {
        if (Array.isArray(outputConnections)) {
          outputConnections.forEach((conn, index) => {
            if (conn.node && !nodeNames.has(conn.node)) {
              this.addError(
                `Connection references non-existent target node: ${conn.node}`,
                `connections.${sourceName}[${index}]`
              );
            }
          });
        }
      });
    });
  }

  validateSecurity(workflow) {
    // Check for potential sensitive data
    const workflowString = JSON.stringify(workflow);
    const sensitivePatterns = [
      /api[_-]?key/i,
      /api[_-]?secret/i,
      /password/i,
      /token/i,
      /credential/i
    ];

    sensitivePatterns.forEach(pattern => {
      if (pattern.test(workflowString)) {
        this.addWarning(
          `Potential sensitive data detected matching pattern: ${pattern.source}`,
          ''
        );
      }
    });
  }

  hasCredentials(workflow) {
    if (!workflow.nodes) return false;
    
    return workflow.nodes.some(node => 
      node.credentials && Object.keys(node.credentials).length > 0
    );
  }

  generateReport(filePath, metadata = {}) {
    const isValid = this.errors.length === 0;
    const hasWarnings = this.warnings.length > 0;
    
    return {
      file: filePath,
      valid: isValid,
      metadata,
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        info: this.info.length
      },
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
      status: isValid ? (hasWarnings ? 'passed_with_warnings' : 'passed') : 'failed'
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: workflow-validator.js <workflow-file> [--strict] [--json]');
    process.exit(1);
  }

  const filePath = args[0];
  const strictMode = args.includes('--strict');
  const jsonOutput = args.includes('--json');

  const validator = new WorkflowValidator({ strictMode });
  
  try {
    const report = await validator.validateFile(filePath);
    
    if (jsonOutput) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      // Human-readable output
      console.log(`\n🔍 Validation Report for: ${path.basename(filePath)}`);
      console.log('='.repeat(50));
      
      if (report.metadata.name) {
        console.log(`📋 Workflow: ${report.metadata.name}`);
        console.log(`🔢 Nodes: ${report.metadata.nodeCount}`);
      }
      
      console.log(`\n📊 Summary:`);
      console.log(`  Errors: ${report.summary.errors}`);
      console.log(`  Warnings: ${report.summary.warnings}`);
      
      if (report.errors.length > 0) {
        console.log('\n❌ Errors:');
        report.errors.forEach(err => {
          console.log(`  - ${err.message}`);
          if (err.path) console.log(`    at: ${err.path}`);
        });
      }
      
      if (report.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        report.warnings.forEach(warn => {
          console.log(`  - ${warn.message}`);
          if (warn.path) console.log(`    at: ${warn.path}`);
        });
      }
      
      console.log('\n' + '='.repeat(50));
      if (report.valid) {
        console.log('✅ Validation passed!');
      } else {
        console.log('❌ Validation failed!');
      }
    }
    
    process.exit(report.valid ? 0 : 1);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for use as module
module.exports = WorkflowValidator;

// Run CLI if called directly
if (require.main === module) {
  main();
}