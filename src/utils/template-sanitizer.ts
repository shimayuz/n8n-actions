import { logger } from '../utils/logger';

export interface SanitizationResult {
  sanitized: any;
  wasModified: boolean;
  removedTokens: string[];
  warnings: string[];
}

export class TemplateSanitizer {
  // Common patterns for sensitive data
  private readonly SENSITIVE_PATTERNS = [
    // API Keys and Tokens
    /\b(api[_-]?key|apikey)\s*[:=]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    /\b(token|access[_-]?token)\s*[:=]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    /\b(secret|password|passwd)\s*[:=]\s*['"]?([^'"\s]{8,})['"]?/gi,

    // Bearer tokens
    /\bBearer\s+([a-zA-Z0-9_-]{20,})/gi,

    // Database credentials
    /\b(host|hostname)\s*[:=]\s*['"]?([^'"\s]+)['"]?/gi,
    /\b(port)\s*[:=]\s*['"]?(\d{1,5})['"]?/gi,
    /\b(database|db[_-]?name)\s*[:=]\s*['"]?([^'"\s]+)['"]?/gi,
    /\b(username|user)\s*[:=]\s*['"]?([^'"\s]+)['"]?/gi,

    // URLs with credentials
    /https?:\/\/([^:]+):([^@]+)@/gi,

    // Email addresses in unexpected places
    /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi,

    // Private keys (basic pattern)
    /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,

    // AWS credentials
    /\b(AKIA[0-9A-Z]{16})\b/gi, // AWS Access Key ID
    /\b([a-zA-Z0-9+/]{40})\b/gi, // AWS Secret Access Key (base64-like)

    // Generic long alphanumeric strings that might be keys
    /\b([a-zA-Z0-9]{32,})\b/g
  ];

  // Known safe node types that should never contain sensitive data
  private readonly SAFE_NODE_TYPES = [
    'n8n-nodes-base.start',
    'n8n-nodes-base.set',
    'n8n-nodes-base.if',
    'n8n-nodes-base.switch',
    'n8n-nodes-base.merge',
    'n8n-nodes-base.code',
    'n8n-nodes-base.function',
    'n8n-nodes-base.scheduleTrigger',
    'n8n-nodes-base.webhook'
  ];

  // Node types that commonly contain credentials
  private readonly CREDENTIAL_NODE_TYPES = [
    'n8n-nodes-base.httpRequest',
    'n8n-nodes-base.postgres',
    'n8n-nodes-base.mysql',
    'n8n-nodes-base.mongoDb',
    'n8n-nodes-base.redis',
    'n8n-nodes-base.aws',
    'n8n-nodes-base.google',
    'n8n-nodes-base.slack',
    'n8n-nodes-base.discord',
    'n8n-nodes-base.emailReadImap',
    'n8n-nodes-base.emailSend'
  ];

  /**
   * Sanitize a workflow to remove sensitive data
   */
  sanitizeWorkflow(workflow: any): SanitizationResult {
    const sanitized = JSON.parse(JSON.stringify(workflow)); // Deep clone
    const removedTokens: string[] = [];
    const warnings: string[] = [];
    let wasModified = false;

    try {
      if (!sanitized.nodes || !Array.isArray(sanitized.nodes)) {
        warnings.push('Workflow does not contain valid nodes array');
        return { sanitized, wasModified: false, removedTokens, warnings };
      }

      for (const node of sanitized.nodes) {
        const result = this.sanitizeNode(node);
        if (result.wasModified) {
          wasModified = true;
          removedTokens.push(...result.removedTokens);
          warnings.push(...result.warnings);
        }
      }

      // Sanitize workflow metadata
      if (sanitized.name) {
        const nameResult = this.sanitizeString(sanitized.name);
        if (nameResult.wasModified) {
          sanitized.name = nameResult.sanitized;
          wasModified = true;
          removedTokens.push(...nameResult.removedTokens);
        }
      }

      // Log sanitization results
      if (wasModified) {
        logger.warn(`Sanitized workflow "${sanitized.name || 'Unnamed'}": removed ${removedTokens.length} sensitive tokens`, {
          workflowName: sanitized.name,
          removedTokensCount: removedTokens.length,
          warningsCount: warnings.length
        });
      }

    } catch (error) {
      logger.error('Error during workflow sanitization:', error);
      warnings.push('Failed to complete sanitization process');
    }

    return { sanitized, wasModified, removedTokens, warnings };
  }

  /**
   * Sanitize a single node
   */
  private sanitizeNode(node: any): SanitizationResult {
    const removedTokens: string[] = [];
    const warnings: string[] = [];
    let wasModified = false;

    try {
      // Check if this node type commonly contains credentials
      const isCredentialNode = this.CREDENTIAL_NODE_TYPES.some(type =>
        node.type?.toLowerCase().includes(type.toLowerCase().replace('n8n-nodes-base.', ''))
      );

      // Sanitize node parameters
      if (node.parameters) {
        const paramResult = this.sanitizeObject(node.parameters, isCredentialNode);
        if (paramResult.wasModified) {
          node.parameters = paramResult.sanitized;
          wasModified = true;
          removedTokens.push(...paramResult.removedTokens);
          warnings.push(...paramResult.warnings);
        }
      }

      // Sanitize node credentials
      if (node.credentials) {
        const credResult = this.sanitizeCredentials(node.credentials);
        if (credResult.wasModified) {
          node.credentials = credResult.sanitized;
          wasModified = true;
          removedTokens.push(...credResult.removedTokens);
          warnings.push(...credResult.warnings);
        }
      }

      // Sanitize node name
      if (node.name) {
        const nameResult = this.sanitizeString(node.name);
        if (nameResult.wasModified) {
          node.name = nameResult.sanitized;
          wasModified = true;
          removedTokens.push(...nameResult.removedTokens);
        }
      }

      // Special handling for code nodes
      if (node.type === 'n8n-nodes-base.code' && node.parameters?.code) {
        const codeResult = this.sanitizeCode(node.parameters.code);
        if (codeResult.wasModified) {
          node.parameters.code = codeResult.sanitized;
          wasModified = true;
          removedTokens.push(...codeResult.removedTokens);
          warnings.push(...codeResult.warnings);
        }
      }

    } catch (error) {
      logger.error(`Error sanitizing node ${node.name || 'unknown'}:`, error);
      warnings.push(`Failed to sanitize node: ${node.name || 'unknown'}`);
    }

    return { sanitized: node, wasModified, removedTokens, warnings };
  }

  /**
   * Sanitize an object recursively
   */
  private sanitizeObject(obj: any, isCredentialContext: boolean = false): SanitizationResult {
    const sanitized = { ...obj };
    const removedTokens: string[] = [];
    const warnings: string[] = [];
    let wasModified = false;

    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        const result = this.sanitizeString(value, isCredentialContext);
        if (result.wasModified) {
          sanitized[key] = result.sanitized;
          wasModified = true;
          removedTokens.push(...result.removedTokens);
        }
      } else if (typeof value === 'object' && value !== null) {
        const result = this.sanitizeObject(value, isCredentialContext);
        if (result.wasModified) {
          sanitized[key] = result.sanitized;
          wasModified = true;
          removedTokens.push(...result.removedTokens);
          warnings.push(...result.warnings);
        }
      }
    }

    return { sanitized, wasModified, removedTokens, warnings };
  }

  /**
   * Sanitize credentials object
   */
  private sanitizeCredentials(credentials: any): SanitizationResult {
    const sanitized = { ...credentials };
    const removedTokens: string[] = [];
    const warnings: string[] = [];
    let wasModified = false;

    for (const [credType, credData] of Object.entries(sanitized)) {
      if (typeof credData === 'object' && credData !== null) {
        // Always treat credentials as sensitive context
        const result = this.sanitizeObject(credData, true);
        if (result.wasModified) {
          sanitized[credType] = result.sanitized;
          wasModified = true;
          removedTokens.push(...result.removedTokens);
          warnings.push(...result.warnings);
        }
      }
    }

    return { sanitized, wasModified, removedTokens, warnings };
  }

  /**
   * Sanitize a string value
   */
  private sanitizeString(value: string, isCredentialContext: boolean = false): SanitizationResult & { sanitized: string } {
    let sanitized = value;
    const removedTokens: string[] = [];
    let wasModified = false;

    // Apply all sensitive patterns
    for (const pattern of this.SENSITIVE_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Skip if this looks like a legitimate URL or email in non-credential context
          if (!isCredentialContext && (
            match.includes('http') ||
            match.includes('@') ||
            match.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
          )) {
            continue;
          }

          sanitized = sanitized.replace(match, '[REDACTED]');
          removedTokens.push(match.substring(0, 20) + '...'); // Only log first 20 chars
          wasModified = true;
        }
      }
    }

    return { sanitized, wasModified, removedTokens, warnings: [] };
  }

  /**
   * Sanitize code content
   */
  private sanitizeCode(code: string): SanitizationResult & { sanitized: string } {
    // For code, be more conservative - only remove obvious API keys and tokens
    const patterns = [
      /\b(api[_-]?key|apikey|token|secret)\s*[:=]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
      /['"]([a-zA-Z0-9_-]{32,})['"]/g // Long alphanumeric strings in quotes
    ];

    let sanitized = code;
    const removedTokens: string[] = [];
    let wasModified = false;

    for (const pattern of patterns) {
      const matches = sanitized.match(pattern);
      if (matches) {
        for (const match of matches) {
          sanitized = sanitized.replace(match, '"[REDACTED]"');
          removedTokens.push(match.substring(0, 20) + '...');
          wasModified = true;
        }
      }
    }

    return { sanitized, wasModified, removedTokens, warnings: [] };
  }

  /**
   * Detect potential tokens in a workflow (for logging purposes)
   */
  detectTokens(workflow: any): { count: number; types: string[] } {
    const tokens: string[] = [];
    let totalCount = 0;

    if (workflow.nodes) {
      for (const node of workflow.nodes) {
        if (node.parameters) {
          const result = this.detectTokensInObject(node.parameters);
          tokens.push(...result.types);
          totalCount += result.count;
        }
        if (node.credentials) {
          const result = this.detectTokensInObject(node.credentials);
          tokens.push(...result.types);
          totalCount += result.count;
        }
      }
    }

    return {
      count: totalCount,
      types: [...new Set(tokens)]
    };
  }

  /**
   * Detect tokens in an object
   */
  private detectTokensInObject(obj: any): { count: number; types: string[] } {
    const types: string[] = [];
    let count = 0;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        for (const pattern of this.SENSITIVE_PATTERNS) {
          if (value.match(pattern)) {
            types.push(key);
            count++;
            break; // Only count once per key
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        const result = this.detectTokensInObject(value);
        types.push(...result.types);
        count += result.count;
      }
    }

    return { count, types: [...new Set(types)] };
  }

  /**
   * Validate workflow for security issues
   */
  validateWorkflowSecurity(workflow: any): {
    isSecure: boolean;
    issues: Array<{
      type: 'warning' | 'error';
      message: string;
      node?: string;
      parameter?: string;
    }>;
  } {
    const issues: Array<{
      type: 'warning' | 'error';
      message: string;
      node?: string;
      parameter?: string;
    }> = [];

    try {
      if (!workflow.nodes) {
        issues.push({
          type: 'error',
          message: 'Workflow does not contain nodes'
        });
        return { isSecure: false, issues };
      }

      for (const node of workflow.nodes) {
        // Check for hardcoded credentials
        if (node.parameters) {
          const paramIssues = this.validateParameters(node.parameters, node.name);
          issues.push(...paramIssues);
        }

        // Check for insecure node configurations
        if (node.type === 'n8n-nodes-base.httpRequest') {
          const httpIssues = this.validateHttpNode(node);
          issues.push(...httpIssues);
        }

        // Check for code nodes with potential security issues
        if (node.type === 'n8n-nodes-base.code') {
          const codeIssues = this.validateCodeNode(node);
          issues.push(...codeIssues);
        }
      }

    } catch (error) {
      issues.push({
        type: 'error',
        message: `Security validation failed: ${error}`
      });
    }

    const isSecure = !issues.some(issue => issue.type === 'error');

    return { isSecure, issues };
  }

  /**
   * Validate node parameters for security issues
   */
  private validateParameters(parameters: any, nodeName: string): Array<{
    type: 'warning' | 'error';
    message: string;
    node?: string;
    parameter?: string;
  }> {
    const issues: Array<{
      type: 'warning' | 'error';
      message: string;
      node?: string;
      parameter?: string;
    }> = [];

    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'apiKey', 'accessToken'];

    for (const [key, value] of Object.entries(parameters)) {
      // Check for hardcoded sensitive values
      if (sensitiveKeys.some(sensitiveKey =>
        key.toLowerCase().includes(sensitiveKey.toLowerCase())
      )) {
        if (typeof value === 'string' && value.length > 0) {
          issues.push({
            type: 'warning',
            message: `Potential hardcoded sensitive value in parameter: ${key}`,
            node: nodeName,
            parameter: key
          });
        }
      }

      // Check for suspicious URLs
      if (key.toLowerCase().includes('url') && typeof value === 'string') {
        if (value.includes('localhost') || value.includes('127.0.0.1')) {
          issues.push({
            type: 'warning',
            message: 'Using localhost URL in production workflow',
            node: nodeName,
            parameter: key
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate HTTP request node configuration
   */
  private validateHttpNode(node: any): Array<{
    type: 'warning' | 'error';
    message: string;
    node?: string;
    parameter?: string;
  }> {
    const issues: Array<{
      type: 'warning' | 'error';
      message: string;
      node?: string;
      parameter?: string;
    }> = [];

    const params = node.parameters || {};

    // Check for HTTP basic auth with hardcoded credentials
    if (params.authentication === 'basicAuth' &&
        (params.user || params.password)) {
      issues.push({
        type: 'warning',
        message: 'HTTP Basic Authentication with potential hardcoded credentials',
        node: node.name,
        parameter: 'authentication'
      });
    }

    // Check for insecure HTTP URLs
    if (params.url && typeof params.url === 'string' &&
        params.url.startsWith('http://')) {
      issues.push({
        type: 'warning',
        message: 'Using insecure HTTP URL instead of HTTPS',
        node: node.name,
        parameter: 'url'
      });
    }

    return issues;
  }

  /**
   * Validate code node for security issues
   */
  private validateCodeNode(node: any): Array<{
    type: 'warning' | 'error';
    message: string;
    node?: string;
    parameter?: string;
  }> {
    const issues: Array<{
      type: 'warning' | 'error';
      message: string;
      node?: string;
      parameter?: string;
    }> = [];

    const code = node.parameters?.code || '';

    // Check for dangerous functions
    const dangerousPatterns = [
      /\beval\s*\(/gi,
      /\bexec\s*\(/gi,
      /\bspawn\s*\(/gi,
      /\bchild_process/gi,
      /\bfs\./gi,
      /\brequire\s*\(\s*['"]child_process['"]\s*\)/gi
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        issues.push({
          type: 'error',
          message: `Potentially dangerous code pattern detected: ${pattern.source}`,
          node: node.name,
          parameter: 'code'
        });
      }
    }

    // Check for network requests
    if (/\bhttps?\./.test(code) || /\bfetch\s*\(/gi.test(code)) {
      issues.push({
        type: 'warning',
        message: 'Code node making network requests',
        node: node.name,
        parameter: 'code'
      });
    }

    return issues;
  }
}
