#!/usr/bin/env node

/**
 * Playwright Workflow Tester
 * Advanced testing and debugging for n8n workflows using Playwright
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class PlaywrightWorkflowTester {
  constructor(options = {}) {
    this.options = {
      headless: true,
      timeout: 60000,
      viewport: { width: 1920, height: 1080 },
      screenshotOnError: true,
      ...options
    };
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async initialize() {
    this.browser = await chromium.launch({
      headless: this.options.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.context = await this.browser.newContext({
      viewport: this.options.viewport,
      ignoreHTTPSErrors: true,
      locale: 'en-US'
    });
    
    this.page = await this.context.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
    
    // Set up request logging for debugging
    if (this.options.debug) {
      this.page.on('request', request => {
        console.log('→', request.method(), request.url());
      });
      
      this.page.on('response', response => {
        if (response.status() >= 400) {
          console.log('←', response.status(), response.url());
        }
      });
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async testWorkflowImport(workflowPath, n8nUrl) {
    const testResults = {
      workflow: path.basename(workflowPath),
      tests: [],
      errors: [],
      warnings: [],
      performance: {}
    };

    try {
      // Read workflow
      const workflowContent = await fs.readFile(workflowPath, 'utf8');
      const workflow = JSON.parse(workflowContent);
      
      console.log(`\n🧪 Testing workflow: ${workflow.name || 'Unnamed'}`);
      
      // Test 1: Navigate to n8n
      const startTime = Date.now();
      await this.test('Navigate to n8n', async () => {
        await this.page.goto(n8nUrl, { 
          waitUntil: 'networkidle',
          timeout: this.options.timeout 
        });
        
        // Check if login is required
        const loginForm = await this.page.locator('form[name="login"], [data-test-id="login-form"]').count();
        if (loginForm > 0) {
          throw new Error('Login required - please provide authentication');
        }
      }, testResults);
      
      testResults.performance.initialLoadTime = Date.now() - startTime;
      
      // Test 2: Access workflows page
      await this.test('Access workflows page', async () => {
        await this.page.goto(`${n8nUrl}/workflows`, { waitUntil: 'networkidle' });
        await this.page.waitForSelector('[data-test-id="workflows-list"], .workflows-list', {
          timeout: 10000
        });
      }, testResults);
      
      // Test 3: Open import dialog
      await this.test('Open import dialog', async () => {
        // Try multiple selectors for import button
        const importSelectors = [
          'button:has-text("Import")',
          '[data-test-id="import-workflow"]',
          '.workflow-import-button',
          'button[title*="Import"]'
        ];
        
        let importButton = null;
        for (const selector of importSelectors) {
          try {
            importButton = await this.page.locator(selector).first();
            if (await importButton.isVisible()) break;
          } catch (e) {
            // Continue trying other selectors
          }
        }
        
        if (!importButton || !(await importButton.isVisible())) {
          throw new Error('Import button not found');
        }
        
        await importButton.click();
        
        // Wait for import dialog
        await this.page.waitForSelector('.modal, [data-test-id="import-dialog"]', {
          timeout: 5000
        });
      }, testResults);
      
      // Test 4: Import workflow JSON
      await this.test('Import workflow JSON', async () => {
        // Find JSON input area
        const jsonInputSelectors = [
          'textarea',
          '[contenteditable="true"]',
          '[data-test-id="workflow-json-input"]',
          '.ace_editor'
        ];
        
        let jsonInput = null;
        for (const selector of jsonInputSelectors) {
          try {
            jsonInput = await this.page.locator(selector).first();
            if (await jsonInput.isVisible()) break;
          } catch (e) {
            // Continue trying
          }
        }
        
        if (!jsonInput) {
          throw new Error('JSON input field not found');
        }
        
        // Clear and fill with workflow JSON
        await jsonInput.click();
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Delete');
        await jsonInput.fill(workflowContent);
        
        // Find and click import/confirm button
        const confirmButton = await this.page.locator(
          'button:has-text("Import"), button:has-text("Save"), button:has-text("OK")'
        ).last();
        
        await confirmButton.click();
        
        // Wait for workflow editor
        await this.page.waitForSelector('.workflow-canvas, [data-test-id="canvas"]', {
          timeout: 15000
        });
      }, testResults);
      
      // Test 5: Verify workflow loaded
      await this.test('Verify workflow loaded', async () => {
        // Check for nodes on canvas
        const nodes = await this.page.locator('.node, [data-test-id="canvas-node"]').count();
        
        if (nodes === 0) {
          throw new Error('No nodes found on canvas after import');
        }
        
        console.log(`   ✓ Found ${nodes} nodes on canvas`);
        
        // Check workflow name
        const workflowName = await this.page.locator(
          '[data-test-id="workflow-name"], .workflow-name'
        ).first().textContent();
        
        if (workflowName) {
          console.log(`   ✓ Workflow name: ${workflowName.trim()}`);
        }
      }, testResults);
      
      // Test 6: Check for errors
      await this.test('Check for import errors', async () => {
        const errorSelectors = [
          '.error',
          '[data-test-id="error"]',
          '.notification-error',
          '.toast-error'
        ];
        
        for (const selector of errorSelectors) {
          const errors = await this.page.locator(selector).all();
          for (const error of errors) {
            const errorText = await error.textContent();
            testResults.errors.push({
              type: 'ui_error',
              message: errorText
            });
          }
        }
        
        if (testResults.errors.length > 0) {
          throw new Error(`Found ${testResults.errors.length} errors in UI`);
        }
      }, testResults);
      
      // Test 7: Validate workflow structure
      await this.test('Validate workflow structure', async () => {
        const validationResult = await this.page.evaluate(() => {
          // This runs in the browser context
          const canvas = document.querySelector('.workflow-canvas, [data-test-id="canvas"]');
          if (!canvas) return { valid: false, error: 'Canvas not found' };
          
          const nodes = document.querySelectorAll('.node, [data-test-id="canvas-node"]');
          const connections = document.querySelectorAll('.connection, .edge');
          
          return {
            valid: true,
            nodeCount: nodes.length,
            connectionCount: connections.length
          };
        });
        
        if (!validationResult.valid) {
          throw new Error(validationResult.error);
        }
        
        console.log(`   ✓ Nodes: ${validationResult.nodeCount}, Connections: ${validationResult.connectionCount}`);
      }, testResults);
      
      // Performance metrics
      testResults.performance.totalTestTime = Date.now() - startTime;
      
    } catch (error) {
      testResults.errors.push({
        type: 'general',
        message: error.message,
        stack: error.stack
      });
      
      if (this.options.screenshotOnError) {
        try {
          const screenshotPath = `playwright-error-${Date.now()}.png`;
          await this.page.screenshot({ path: screenshotPath, fullPage: true });
          console.error(`   📸 Error screenshot saved: ${screenshotPath}`);
        } catch (e) {
          console.error('   Failed to capture error screenshot');
        }
      }
    }
    
    return testResults;
  }

  async test(name, testFn, results) {
    console.log(`\n📋 ${name}...`);
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      results.tests.push({
        name,
        status: 'passed',
        duration
      });
      console.log(`   ✅ Passed (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      results.tests.push({
        name,
        status: 'failed',
        duration,
        error: error.message
      });
      console.error(`   ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  async captureDebugInfo(outputDir = 'playwright-debug') {
    await fs.mkdir(outputDir, { recursive: true });
    
    // Capture screenshot
    const screenshotPath = path.join(outputDir, 'screenshot.png');
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Capture page HTML
    const htmlPath = path.join(outputDir, 'page.html');
    const html = await this.page.content();
    await fs.writeFile(htmlPath, html);
    
    // Capture console logs
    const logs = [];
    this.page.on('console', msg => logs.push({
      type: msg.type(),
      text: msg.text()
    }));
    
    // Capture network activity
    const networkLog = [];
    this.page.on('request', request => networkLog.push({
      type: 'request',
      url: request.url(),
      method: request.method()
    }));
    
    this.page.on('response', response => networkLog.push({
      type: 'response',
      url: response.url(),
      status: response.status()
    }));
    
    // Save debug info
    const debugInfo = {
      timestamp: new Date().toISOString(),
      url: this.page.url(),
      viewport: this.page.viewportSize(),
      logs,
      network: networkLog
    };
    
    const debugPath = path.join(outputDir, 'debug-info.json');
    await fs.writeFile(debugPath, JSON.stringify(debugInfo, null, 2));
    
    console.log(`\n📁 Debug information saved to: ${outputDir}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: playwright-workflow-tester.js <workflow-file> <n8n-url> [options]');
    console.error('Options:');
    console.error('  --headless=false    Run in headful mode');
    console.error('  --debug             Enable debug logging');
    console.error('  --capture-debug     Capture debug information');
    process.exit(1);
  }
  
  const workflowFile = args[0];
  const n8nUrl = args[1];
  
  // Parse options
  const options = {
    headless: !args.includes('--headless=false'),
    debug: args.includes('--debug'),
    captureDebug: args.includes('--capture-debug')
  };
  
  console.log('🚀 Playwright Workflow Tester');
  console.log(`📄 Workflow: ${workflowFile}`);
  console.log(`🌐 n8n URL: ${n8nUrl}`);
  console.log(`🔧 Options:`, options);
  
  const tester = new PlaywrightWorkflowTester(options);
  
  try {
    await tester.initialize();
    const results = await tester.testWorkflowImport(workflowFile, n8nUrl);
    
    if (options.captureDebug) {
      await tester.captureDebugInfo();
    }
    
    // Generate report
    const reportPath = 'playwright-test-report.json';
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📊 Test report saved: ${reportPath}`);
    
    // Exit code based on results
    const hasErrors = results.errors.length > 0 || 
                     results.tests.some(t => t.status === 'failed');
    
    process.exit(hasErrors ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Export for use as module
module.exports = PlaywrightWorkflowTester;

// Run CLI if called directly
if (require.main === module) {
  main();
}