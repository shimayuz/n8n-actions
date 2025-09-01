#!/usr/bin/env node
/**
 * Template System Integration Test
 * Tests the complete template management system end-to-end
 */

import { createDatabaseAdapter } from '../src/database/database-adapter';
import { TemplateService } from '../src/templates/template-service';
import { TemplateFetcher } from '../src/templates/template-fetcher';
import { TemplateSanitizer } from '../src/utils/template-sanitizer';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  test: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class TemplateSystemTester {
  private db: any;
  private service: TemplateService;
  private sanitizer: TemplateSanitizer;
  private results: TestResult[] = [];

  constructor() {
    this.sanitizer = new TemplateSanitizer();
  }

  async initialize(): Promise<void> {
    // Create test database
    const testDbPath = './test-templates.db';
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    this.db = await createDatabaseAdapter(testDbPath);

    // Initialize schema
    const schemaPath = path.join(__dirname, '../database/template-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);

    this.service = new TemplateService(this.db);
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Template System Integration Tests...\n');

    const tests = [
      this.testDatabaseInitialization.bind(this),
      this.testTemplateSanitization.bind(this),
      this.testTemplateStorage.bind(this),
      this.testTemplateSearch.bind(this),
      this.testTemplateRecommendations.bind(this),
      this.testWorkflowValidation.bind(this),
      this.testSecurityValidation.bind(this)
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.printResults();
  }

  private async runTest(testFn: () => Promise<void>): Promise<void> {
    const testName = testFn.name.replace('bound ', '').replace('.bind(this)', '');
    const startTime = Date.now();

    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({
        test: testName,
        passed: true,
        duration
      });
      console.log(`✅ ${testName} passed (${duration}ms)`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: testName,
        passed: false,
        duration,
        error: error.message,
        details: error
      });
      console.log(`❌ ${testName} failed (${duration}ms): ${error.message}`);
    }
  }

  private async testDatabaseInitialization(): Promise<void> {
    // Test database connection and schema
    const stats = this.db.getStats();
    if (stats.tables < 5) {
      throw new Error(`Expected at least 5 tables, got ${stats.tables}`);
    }

    // Test basic queries
    const templateCount = this.db.prepare('SELECT COUNT(*) as count FROM templates').get();
    if (typeof templateCount.count !== 'number') {
      throw new Error('Template count query failed');
    }
  }

  private async testTemplateSanitization(): Promise<void> {
    const testWorkflow = {
      name: 'Test Workflow with Secrets',
      nodes: [
        {
          id: '1',
          name: 'HTTP Request with API Key',
          type: 'n8n-nodes-base.httpRequest',
          parameters: {
            url: 'https://api.example.com',
            headers: {
              'Authorization': 'Bearer sk-12345678901234567890123456789012',
              'X-API-Key': 'api_key_abcdef123456'
            }
          }
        },
        {
          id: '2',
          name: 'Code with Secrets',
          type: 'n8n-nodes-base.code',
          parameters: {
            code: 'const apiKey = "sk-abcdef12345678901234567890123456";'
          }
        }
      ]
    };

    const result = this.sanitizer.sanitizeWorkflow(testWorkflow);

    if (!result.wasModified) {
      throw new Error('Sanitization should have detected sensitive data');
    }

    if (result.removedTokens.length === 0) {
      throw new Error('Should have removed some tokens');
    }

    // Verify sensitive data was removed
    const sanitizedJson = JSON.stringify(result.sanitized);
    if (sanitizedJson.includes('sk-12345678901234567890123456789012') ||
        sanitizedJson.includes('sk-abcdef12345678901234567890123456')) {
      throw new Error('Sensitive tokens were not properly sanitized');
    }
  }

  private async testTemplateStorage(): Promise<void> {
    const testTemplate = {
      id: 999999,
      name: 'Test Template',
      description: 'A test template for integration testing',
      author: {
        name: 'Test Author',
        username: 'testuser',
        verified: false
      },
      nodes: ['n8n-nodes-base.webhook', 'n8n-nodes-base.httpRequest'],
      views: 100,
      url: 'https://n8n.io/workflows/999999'
    };

    const testDetail = {
      workflow: {
        id: '999999',
        name: 'Test Workflow',
        nodes: [
          {
            id: '1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            parameters: {}
          }
        ],
        connections: {}
      },
      categories: ['webhook', 'api']
    };

    // Store template
    await this.service.saveTemplate(testTemplate, testDetail);

    // Retrieve template
    const retrieved = await this.service.getTemplate(999999);
    if (!retrieved) {
      throw new Error('Template was not stored correctly');
    }

    if (retrieved.name !== testTemplate.name) {
      throw new Error('Template data was not stored correctly');
    }
  }

  private async testTemplateSearch(): Promise<void> {
    // Add some test templates first
    const templates = [
      {
        id: 100001,
        name: 'Email Automation Workflow',
        description: 'Automate email processing and responses',
        author: { name: 'Test', username: 'test', verified: false },
        nodes: ['n8n-nodes-base.emailReadImap', 'n8n-nodes-base.emailSend'],
        views: 150,
        url: 'https://n8n.io/workflows/100001'
      },
      {
        id: 100002,
        name: 'Slack Integration Template',
        description: 'Connect with Slack for notifications',
        author: { name: 'Test', username: 'test', verified: false },
        nodes: ['n8n-nodes-base.slack'],
        views: 200,
        url: 'https://n8n.io/workflows/100002'
      }
    ];

    for (const template of templates) {
      await this.service.saveTemplate(template, {
        workflow: { id: template.id.toString(), name: template.name, nodes: [], connections: {} },
        categories: ['communication']
      });
    }

    // Test search by node type
    const emailTemplates = await this.service.listNodeTemplates(['n8n-nodes-base.emailReadImap']);
    if (emailTemplates.length === 0) {
      throw new Error('Email template search failed');
    }

    // Test text search
    const searchResults = await this.service.searchTemplates('email');
    if (searchResults.templates.length === 0) {
      throw new Error('Text search failed');
    }
  }

  private async testTemplateRecommendations(): Promise<void> {
    const request = {
      purpose: 'Send automated email notifications',
      requiredIntegrations: ['email', 'slack'],
      complexity: 'medium' as const
    };

    const recommendations = await this.service.getWorkflowRecommendations(request);

    if (!recommendations.recommendedTemplates) {
      throw new Error('Recommendations should include templates array');
    }

    if (!recommendations.suggestedNodes || recommendations.suggestedNodes.length === 0) {
      throw new Error('Recommendations should include suggested nodes');
    }

    if (!recommendations.reasoning) {
      throw new Error('Recommendations should include reasoning');
    }
  }

  private async testWorkflowValidation(): Promise<void> {
    const validWorkflow = {
      id: 'test-123',
      name: 'Valid Test Workflow',
      nodes: [
        {
          id: '1',
          name: 'Start',
          type: 'n8n-nodes-base.start',
          parameters: {}
        },
        {
          id: '2',
          name: 'Set',
          type: 'n8n-nodes-base.set',
          parameters: {
            values: {
              string: [{ name: 'test', value: 'value' }]
            }
          }
        }
      ],
      connections: {
        '1': {
          main: [[{ node: '2', type: 'main', index: 0 }]]
        }
      }
    };

    const validation = await this.service.validateTemplateIntegrity(999999);
    if (!validation.isValid) {
      throw new Error('Template validation failed');
    }
  }

  private async testSecurityValidation(): Promise<void> {
    const insecureWorkflow = {
      name: 'Insecure Workflow',
      nodes: [
        {
          id: '1',
          name: 'HTTP with Hardcoded Key',
          type: 'n8n-nodes-base.httpRequest',
          parameters: {
            url: 'https://api.example.com',
            headers: {
              'Authorization': 'Bearer hardcoded-secret-key-12345'
            }
          }
        }
      ]
    };

    const securityCheck = this.sanitizer.validateWorkflowSecurity(insecureWorkflow);

    if (securityCheck.isSecure) {
      throw new Error('Security validation should have detected issues');
    }

    if (securityCheck.issues.length === 0) {
      throw new Error('Should have found security issues');
    }
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(50));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Average Time: ${Math.round(totalTime / this.results.length)}ms per test`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  • ${result.test}: ${result.error}`);
      });
    }

    console.log('\n✅ All tests completed!');
  }

  async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
    }

    // Clean up test database
    const testDbPath = './test-templates.db';
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  }
}

// Run tests if called directly
async function main() {
  const tester = new TemplateSystemTester();

  try {
    await tester.initialize();
    await tester.runAllTests();
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { TemplateSystemTester };
