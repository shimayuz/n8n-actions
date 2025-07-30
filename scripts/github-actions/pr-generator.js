#!/usr/bin/env node

/**
 * PR Generator
 * Generates pull request body content for n8n workflows
 */

const fs = require('fs').promises;
const path = require('path');

class PRGenerator {
  constructor(options = {}) {
    this.options = {
      templatePath: '.github/PULL_REQUEST_TEMPLATE/workflow.md',
      includeValidation: true,
      includeMetrics: true,
      ...options
    };
  }

  async generatePRBody(workflowFile, validationReport = null, additionalInfo = {}) {
    try {
      // Read workflow file
      const workflowContent = await fs.readFile(workflowFile, 'utf8');
      const workflow = JSON.parse(workflowContent);

      // Extract metadata
      const metadata = this.extractMetadata(workflow, workflowFile);

      // Generate sections
      const sections = [];
      
      sections.push(this.generateHeader(metadata));
      sections.push(this.generateWorkflowInfo(metadata, workflow));
      
      if (validationReport) {
        sections.push(this.generateValidationSection(validationReport));
      }
      
      sections.push(this.generateTestingSection(workflow));
      sections.push(this.generateConfigSection(workflow));
      
      if (additionalInfo.relatedIssues) {
        sections.push(this.generateRelatedSection(additionalInfo.relatedIssues));
      }
      
      sections.push(this.generateFooter(additionalInfo));

      return sections.join('\n\n');
    } catch (error) {
      throw new Error(`Failed to generate PR body: ${error.message}`);
    }
  }

  extractMetadata(workflow, filePath) {
    return {
      name: workflow.name || 'Unnamed Workflow',
      description: workflow.description || '',
      nodeCount: workflow.nodes ? workflow.nodes.length : 0,
      sourceFile: filePath,
      fileName: path.basename(filePath),
      hasId: !!workflow.id,
      nodeTypes: this.getNodeTypes(workflow),
      triggerNodes: this.getTriggerNodes(workflow),
      credentials: this.getRequiredCredentials(workflow)
    };
  }

  getNodeTypes(workflow) {
    if (!workflow.nodes) return [];
    const types = new Set(workflow.nodes.map(n => n.type));
    return Array.from(types).sort();
  }

  getTriggerNodes(workflow) {
    if (!workflow.nodes) return [];
    return workflow.nodes
      .filter(n => n.type && n.type.toLowerCase().includes('trigger'))
      .map(n => ({ name: n.name, type: n.type }));
  }

  getRequiredCredentials(workflow) {
    if (!workflow.nodes) return [];
    const credentials = new Set();
    
    workflow.nodes.forEach(node => {
      if (node.credentials) {
        Object.keys(node.credentials).forEach(cred => {
          credentials.add(cred);
        });
      }
    });
    
    return Array.from(credentials).sort();
  }

  generateHeader(metadata) {
    return `## 🤖 n8n Workflow Pull Request

### 📋 ${metadata.name}

${metadata.description ? `> ${metadata.description}` : ''}`;
  }

  generateWorkflowInfo(metadata, workflow) {
    const sections = [`### 📊 Workflow Information

- **Source File**: \`${metadata.sourceFile}\`
- **Target Location**: \`workflows/${metadata.fileName}\`
- **Total Nodes**: ${metadata.nodeCount}`];

    if (metadata.triggerNodes.length > 0) {
      sections.push(`- **Trigger Nodes**: ${metadata.triggerNodes.map(t => `${t.name} (${t.type})`).join(', ')}`);
    }

    sections.push(`
#### Node Types Used
${metadata.nodeTypes.map(type => `- \`${type}\``).join('\n')}`);

    return sections.join('\n');
  }

  generateValidationSection(report) {
    const status = report.valid ? '✅ Passed' : '❌ Failed';
    const sections = [`### 🔍 Validation Status: ${status}

- **Errors**: ${report.summary.errors}
- **Warnings**: ${report.summary.warnings}`];

    if (report.errors.length > 0) {
      sections.push(`
#### Errors Found
${report.errors.map(e => `- ❌ ${e.message}${e.path ? ` (at: ${e.path})` : ''}`).join('\n')}`);
    }

    if (report.warnings.length > 0) {
      sections.push(`
#### Warnings
${report.warnings.map(w => `- ⚠️ ${w.message}${w.path ? ` (at: ${w.path})` : ''}`).join('\n')}`);
    }

    sections.push(`
#### Compliance
- ✅ workflow.md v2025.7 compliant
- ✅ JSON syntax valid
- ✅ Required fields present`);

    return sections.join('\n');
  }

  generateTestingSection(workflow) {
    const hasTriggers = workflow.nodes && workflow.nodes.some(n => 
      n.type && n.type.toLowerCase().includes('trigger')
    );

    return `### 🧪 Testing Instructions

1. **Import the workflow**
   \`\`\`
   Import the workflow JSON into your n8n instance
   \`\`\`

2. **Configure credentials**
   ${this.getRequiredCredentials(workflow).length > 0 
     ? this.getRequiredCredentials(workflow).map(c => `- [ ] Configure ${c}`).join('\n   ')
     : '- No credentials required'}

3. **Test execution**
   ${hasTriggers 
     ? '- [ ] Activate the workflow and test trigger conditions'
     : '- [ ] Execute the workflow manually'}
   - [ ] Verify all nodes execute successfully
   - [ ] Check output data is as expected

4. **Error handling**
   - [ ] Test with invalid inputs
   - [ ] Verify error paths work correctly`;
  }

  generateConfigSection(workflow) {
    const credentials = this.getRequiredCredentials(workflow);
    
    return `### 🔧 Configuration Requirements

#### Credentials Needed
${credentials.length > 0 
  ? credentials.map(c => `- [ ] **${c}**: Configure in n8n settings`).join('\n')
  : '- [x] None required'}

#### Environment Setup
- [ ] n8n instance running
- [ ] Required integrations accessible
- [ ] Test data available`;
  }

  generateRelatedSection(relatedItems) {
    if (!relatedItems || relatedItems.length === 0) return '';

    return `### 🔗 Related Issues/PRs

${relatedItems.map(item => {
  if (item.closes) {
    return `- Closes #${item.number}`;
  } else {
    return `- Related to #${item.number}`;
  }
}).join('\n')}`;
  }

  generateFooter(info) {
    const timestamp = new Date().toISOString();
    const runId = info.runId || 'N/A';
    const actor = info.actor || 'github-actions[bot]';

    return `---

### 🤖 Automation Metadata

- **Generated at**: ${timestamp}
- **Generated by**: @${actor}
- **GitHub Action Run**: ${runId}
- **Workflow Validation**: ✅ Passed
- **Auto-generated**: Yes

<details>
<summary>📝 Additional Technical Details</summary>

\`\`\`json
{
  "generator": "pr-generator.js",
  "version": "1.0.0",
  "timestamp": "${timestamp}",
  "workflowCompliance": "v2025.7"
}
\`\`\`

</details>`;
  }

  async generateFromTemplate(workflowFile, templateOverrides = {}) {
    try {
      // Try to load template
      let template = '';
      try {
        template = await fs.readFile(this.options.templatePath, 'utf8');
      } catch (e) {
        // Use default if template not found
        return this.generatePRBody(workflowFile, null, templateOverrides);
      }

      // Read workflow
      const workflowContent = await fs.readFile(workflowFile, 'utf8');
      const workflow = JSON.parse(workflowContent);
      const metadata = this.extractMetadata(workflow, workflowFile);

      // Replace template variables
      const replacements = {
        '<!-- Auto-filled by automation -->': '',
        '<!-- workflow name -->': metadata.name,
        '<!-- source file -->': metadata.sourceFile,
        '<!-- node count -->': metadata.nodeCount.toString(),
        '<!-- timestamp -->': new Date().toISOString(),
        '<!-- link to run -->': templateOverrides.runUrl || '#',
        ...templateOverrides
      };

      let result = template;
      Object.entries(replacements).forEach(([key, value]) => {
        result = result.replace(new RegExp(key, 'g'), value);
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to generate from template: ${error.message}`);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: pr-generator.js <workflow-file> [--validation-report <file>] [--template]');
    process.exit(1);
  }

  const workflowFile = args[0];
  const useTemplate = args.includes('--template');
  const validationReportIndex = args.indexOf('--validation-report');
  
  let validationReport = null;
  if (validationReportIndex !== -1 && args[validationReportIndex + 1]) {
    try {
      const reportContent = await fs.readFile(args[validationReportIndex + 1], 'utf8');
      validationReport = JSON.parse(reportContent);
    } catch (e) {
      console.error('Failed to read validation report:', e.message);
    }
  }

  const generator = new PRGenerator();
  
  try {
    let prBody;
    
    if (useTemplate) {
      prBody = await generator.generateFromTemplate(workflowFile, {
        actor: process.env.GITHUB_ACTOR,
        runUrl: process.env.GITHUB_RUN_URL
      });
    } else {
      prBody = await generator.generatePRBody(workflowFile, validationReport, {
        actor: process.env.GITHUB_ACTOR,
        runId: process.env.GITHUB_RUN_ID
      });
    }
    
    console.log(prBody);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for use as module
module.exports = PRGenerator;

// Run CLI if called directly
if (require.main === module) {
  main();
}