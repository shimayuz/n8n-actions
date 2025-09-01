import { DatabaseAdapter } from '../database/database-adapter';
import { TemplateRepository, StoredTemplate, TemplateWorkflow, TemplateDetail } from './template-repository';
import { logger } from '../utils/logger';

export interface TemplateInfo {
  id: number;
  name: string;
  description: string;
  author: {
    name: string;
    username: string;
    verified: boolean;
  };
  nodes: string[];
  views: number;
  created: string;
  url: string;
}

export interface TemplateWithWorkflow extends TemplateInfo {
  workflow: any;
}

export interface TemplateSearchResult {
  templates: TemplateInfo[];
  totalCount: number;
  searchQuery?: string;
  searchType: 'nodes' | 'text' | 'category';
}

export class TemplateService {
  private repository: TemplateRepository;

  constructor(db: DatabaseAdapter) {
    this.repository = new TemplateRepository(db);
  }

  /**
   * List templates that use specific node types
   */
  async listNodeTemplates(nodeTypes: string[], limit: number = 10): Promise<TemplateInfo[]> {
    const templates = this.repository.getTemplatesByNodes(nodeTypes, limit);
    return templates.map(this.formatTemplateInfo);
  }

  /**
   * Get a specific template with full workflow
   */
  async getTemplate(templateId: number): Promise<TemplateWithWorkflow | null> {
    const template = this.repository.getTemplate(templateId);
    if (!template) {
      return null;
    }

    try {
      const workflow = JSON.parse(template.workflow_json);
      return {
        ...this.formatTemplateInfo(template),
        workflow
      };
    } catch (error) {
      logger.error(`Failed to parse workflow JSON for template ${templateId}:`, error);
      return null;
    }
  }

  /**
   * Search templates by query
   */
  async searchTemplates(query: string, limit: number = 20): Promise<TemplateSearchResult> {
    const templates = this.repository.searchTemplates(query, limit);
    return {
      templates: templates.map(this.formatTemplateInfo),
      totalCount: templates.length,
      searchQuery: query,
      searchType: 'text'
    };
  }

  /**
   * Get templates for a specific task/category
   */
  async getTemplatesForTask(task: string, limit: number = 20): Promise<TemplateSearchResult> {
    const templates = this.repository.getTemplatesForTask(task);
    const limitedTemplates = templates.slice(0, limit);

    return {
      templates: limitedTemplates.map(this.formatTemplateInfo),
      totalCount: templates.length,
      searchType: 'category'
    };
  }

  /**
   * Find best matching templates for a workflow request
   */
  async findMatchingTemplates(request: {
    description?: string;
    requiredNodes?: string[];
    task?: string;
    complexity?: 'simple' | 'medium' | 'complex';
  }): Promise<TemplateInfo[]> {
    const { description, requiredNodes, task, complexity } = request;
    let candidates: StoredTemplate[] = [];

    // Search by task category first
    if (task) {
      candidates = this.repository.getTemplatesForTask(task);
    }

    // Search by required nodes
    if (requiredNodes && requiredNodes.length > 0) {
      const nodeTemplates = this.repository.getTemplatesByNodes(requiredNodes, 50);
      if (candidates.length === 0) {
        candidates = nodeTemplates;
      } else {
        // Combine results, preferring templates that match both criteria
        const nodeTemplateIds = new Set(nodeTemplates.map(t => t.id));
        const combined = [
          ...candidates.filter(t => nodeTemplateIds.has(t.id)),
          ...nodeTemplates.filter(t => !candidates.some(c => c.id === t.id))
        ];
        candidates = combined;
      }
    }

    // Search by description if no other criteria
    if (candidates.length === 0 && description) {
      const searchResults = this.repository.searchTemplates(description, 50);
      candidates = searchResults;
    }

    // Sort by relevance (views + node match count)
    const sorted = candidates
      .map(template => {
        let score = template.views;

        // Boost score for node matches
        if (requiredNodes) {
          const templateNodes = JSON.parse(template.nodes_used);
          const matchCount = requiredNodes.filter(node =>
            templateNodes.some((tNode: string) =>
              tNode.toLowerCase().includes(node.toLowerCase()) ||
              node.toLowerCase().includes(tNode.toLowerCase())
            )
          ).length;
          score += matchCount * 1000;
        }

        return { template, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.template);

    return sorted.map(this.formatTemplateInfo);
  }

  /**
   * Get template recommendations for workflow generation
   */
  async getWorkflowRecommendations(request: {
    purpose: string;
    requiredIntegrations: string[];
    complexity: 'simple' | 'medium' | 'complex';
  }): Promise<{
    recommendedTemplates: TemplateInfo[];
    suggestedNodes: string[];
    reasoning: string;
  }> {
    const { purpose, requiredIntegrations, complexity } = request;

    // Find matching templates
    const matchingTemplates = await this.findMatchingTemplates({
      description: purpose,
      requiredNodes: requiredIntegrations,
      complexity
    });

    // Extract commonly used nodes from top templates
    const nodeFrequency = new Map<string, number>();
    matchingTemplates.slice(0, 5).forEach(template => {
      template.nodes.forEach(node => {
        nodeFrequency.set(node, (nodeFrequency.get(node) || 0) + 1);
      });
    });

    const suggestedNodes = Array.from(nodeFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([node]) => node);

    // Generate reasoning
    const reasoning = this.generateRecommendationReasoning(
      purpose,
      requiredIntegrations,
      matchingTemplates.length,
      suggestedNodes
    );

    return {
      recommendedTemplates: matchingTemplates.slice(0, 5),
      suggestedNodes,
      reasoning
    };
  }

  /**
   * List available tasks/categories
   */
  listAvailableTasks(): string[] {
    return [
      'ai_automation',
      'data_sync',
      'webhook_processing',
      'email_automation',
      'slack_integration',
      'data_transformation',
      'file_processing',
      'scheduling',
      'api_integration',
      'database_operations',
      'chatbot',
      'reporting',
      'notification',
      'workflow_orchestration',
      'error_handling'
    ];
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<any> {
    const stats = this.repository.getTemplateStats();
    const usageStats = this.repository.getTemplateUsageStats();

    return {
      ...stats,
      ...usageStats
    };
  }

  /**
   * Record template usage
   */
  async recordTemplateUsage(templateId: number, workflowName: string, context?: string): Promise<void> {
    this.repository.recordTemplateUsage(templateId, workflowName, context);
  }

  /**
   * Format stored template for API response
   */
  private formatTemplateInfo(template: StoredTemplate): TemplateInfo {
    let nodes: string[] = [];
    try {
      nodes = JSON.parse(template.nodes_used);
    } catch (error) {
      logger.warn(`Failed to parse nodes_used for template ${template.id}:`, error);
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      author: {
        name: template.author_name,
        username: template.author_username,
        verified: template.author_verified === 1
      },
      nodes,
      views: template.views,
      created: template.created_at,
      url: template.url
    };
  }

  /**
   * Generate reasoning for template recommendations
   */
  private generateRecommendationReasoning(
    purpose: string,
    integrations: string[],
    templateCount: number,
    suggestedNodes: string[]
  ): string {
    let reasoning = `Found ${templateCount} relevant templates for "${purpose}". `;

    if (integrations.length > 0) {
      reasoning += `Templates include integrations for: ${integrations.join(', ')}. `;
    }

    if (suggestedNodes.length > 0) {
      reasoning += `Recommended node types: ${suggestedNodes.slice(0, 5).join(', ')}`;
      if (suggestedNodes.length > 5) {
        reasoning += ` and ${suggestedNodes.length - 5} more`;
      }
    }

    return reasoning;
  }

  /**
   * Validate template data integrity
   */
  async validateTemplateIntegrity(templateId: number): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const template = this.repository.getTemplate(templateId);
    if (!template) {
      return {
        isValid: false,
        errors: ['Template not found'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate JSON structure
    try {
      JSON.parse(template.workflow_json);
    } catch (error) {
      errors.push('Invalid workflow JSON structure');
    }

    // Validate nodes array
    try {
      const nodes = JSON.parse(template.nodes_used);
      if (!Array.isArray(nodes)) {
        errors.push('Invalid nodes structure - expected array');
      }
    } catch (error) {
      errors.push('Invalid nodes JSON structure');
    }

    // Check for empty required fields
    if (!template.name?.trim()) {
      errors.push('Missing template name');
    }
    if (!template.description?.trim()) {
      warnings.push('Missing or empty description');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
