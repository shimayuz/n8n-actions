import { DatabaseAdapter } from '../database/database-adapter';
import { logger } from '../utils/logger';
import { TemplateSanitizer } from '../utils/template-sanitizer';

export interface StoredTemplate {
  id: number;
  workflow_id: number;
  name: string;
  description: string;
  author_name: string;
  author_username: string;
  author_verified: number;
  nodes_used: string; // JSON string
  workflow_json: string; // JSON string
  categories: string; // JSON string
  views: number;
  created_at: string;
  updated_at: string;
  url: string;
  scraped_at: string;
}

export interface TemplateWorkflow {
  id: number;
  name: string;
  description: string;
  author: {
    name: string;
    username: string;
    verified: boolean;
  };
  nodes: number;
  views: number;
  url: string;
}

export interface TemplateDetail {
  workflow: any;
  categories: string[];
}

export class TemplateRepository {
  private sanitizer: TemplateSanitizer;
  private hasFTS5Support: boolean = false;

  constructor(private db: DatabaseAdapter) {
    this.sanitizer = new TemplateSanitizer();
    this.initializeFTS5();
  }

  /**
   * Initialize FTS5 tables if supported
   */
  private initializeFTS5(): void {
    this.hasFTS5Support = this.db.checkFTS5Support();

    if (this.hasFTS5Support) {
      try {
        // Check if FTS5 table already exists
        const ftsExists = this.db.prepare(`
          SELECT name FROM sqlite_master
          WHERE type='table' AND name='templates_fts'
        `).get() as { name: string } | undefined;

        if (ftsExists) {
          logger.info('FTS5 table already exists for templates');

          // Verify FTS5 is working by doing a test query
          try {
            const testCount = this.db.prepare('SELECT COUNT(*) as count FROM templates_fts').get() as { count: number };
            logger.info(`FTS5 enabled with ${testCount.count} indexed entries`);
          } catch (testError) {
            logger.warn('FTS5 table exists but query failed:', testError);
            this.hasFTS5Support = false;
            return;
          }
        } else {
          // Create FTS5 virtual table
          logger.info('Creating FTS5 virtual table for templates...');
          this.db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS templates_fts USING fts5(
              name, description, content=templates,
              tokenize = 'porter ascii'
            );
          `);

          // Create triggers to keep FTS5 in sync
          this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS templates_ai AFTER INSERT ON templates BEGIN
              INSERT INTO templates_fts(rowid, name, description)
              VALUES (new.id, new.name, new.description);
            END;
          `);

          this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS templates_au AFTER UPDATE ON templates BEGIN
              UPDATE templates_fts SET name = new.name, description = new.description
              WHERE rowid = new.id;
            END;
          `);

          this.db.exec(`
            CREATE TRIGGER IF NOT EXISTS templates_ad AFTER DELETE ON templates BEGIN
              DELETE FROM templates_fts WHERE rowid = old.id;
            END;
          `);

          logger.info('FTS5 support enabled for template search');
        }
      } catch (error: any) {
        logger.warn('Failed to initialize FTS5 for templates:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        this.hasFTS5Support = false;
      }
    } else {
      logger.info('FTS5 not available, using LIKE search for templates');
    }
  }

  /**
   * Save a template to the database
   */
  saveTemplate(workflow: TemplateWorkflow, detail: TemplateDetail): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO templates (
        id, workflow_id, name, description, author_name, author_username,
        author_verified, nodes_used, workflow_json, categories, views,
        created_at, updated_at, url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Extract node types from workflow detail
    const nodeTypes = detail.workflow.nodes?.map((n: any) => n.type) || [];

    // Build URL
    const url = `https://n8n.io/workflows/${workflow.id}`;

    // Sanitize the workflow to remove API tokens
    const { sanitized: sanitizedWorkflow, wasModified } = this.sanitizer.sanitizeWorkflow(detail.workflow);

    // Log if we sanitized any tokens
    if (wasModified) {
      const detectedTokens = this.sanitizer.detectTokens(detail.workflow);
      logger.warn(`Sanitized API tokens in template ${workflow.id}: ${workflow.name}`, {
        templateId: workflow.id,
        templateName: workflow.name,
        detectedTokens: detectedTokens.length
      });
    }

    // Execute insert
    stmt.run(
      workflow.id, // id
      workflow.id, // workflow_id
      workflow.name,
      workflow.description,
      workflow.author.name,
      workflow.author.username,
      workflow.author.verified ? 1 : 0,
      JSON.stringify(nodeTypes), // nodes_used
      JSON.stringify(sanitizedWorkflow), // workflow_json
      JSON.stringify(detail.categories || []), // categories
      workflow.views,
      new Date().toISOString(), // created_at
      new Date().toISOString(), // updated_at
      url
    );

    logger.info(`Saved template: ${workflow.name} (ID: ${workflow.id})`);
  }

  /**
   * Get templates by node types
   */
  getTemplatesByNodes(nodeTypes: string[], limit: number = 10): StoredTemplate[] {
    const placeholders = nodeTypes.map(() => '?').join(',');
    const query = `
      SELECT * FROM templates
      WHERE EXISTS (
        SELECT 1 FROM json_each(nodes_used)
        WHERE value IN (${placeholders})
      )
      ORDER BY views DESC
      LIMIT ?
    `;

    const stmt = this.db.prepare(query);
    return stmt.all([...nodeTypes, limit]) as StoredTemplate[];
  }

  /**
   * Search templates by query
   */
  searchTemplates(query: string, limit: number = 20): StoredTemplate[] {
    if (this.hasFTS5Support) {
      // Use FTS5 search
      const stmt = this.db.prepare(`
        SELECT t.* FROM templates t
        JOIN templates_fts fts ON t.id = fts.rowid
        WHERE templates_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `);
      return stmt.all(`${query}*`, limit) as StoredTemplate[];
    } else {
      // Fallback to LIKE search
      const stmt = this.db.prepare(`
        SELECT * FROM templates
        WHERE name LIKE ? OR description LIKE ?
        ORDER BY views DESC
        LIMIT ?
      `);
      const searchPattern = `%${query}%`;
      return stmt.all(searchPattern, searchPattern, limit) as StoredTemplate[];
    }
  }

  /**
   * Get templates for a specific task/category
   */
  getTemplatesForTask(task: string): StoredTemplate[] {
    const stmt = this.db.prepare(`
      SELECT t.* FROM templates t
      JOIN template_category_relations tcr ON t.id = tcr.template_id
      JOIN template_categories tc ON tcr.category_id = tc.id
      WHERE tc.name = ?
      ORDER BY t.views DESC
    `);
    return stmt.all(task) as StoredTemplate[];
  }

  /**
   * Get a specific template by ID
   */
  getTemplate(templateId: number): StoredTemplate | null {
    const stmt = this.db.prepare('SELECT * FROM templates WHERE id = ?');
    return stmt.get(templateId) as StoredTemplate | null;
  }

  /**
   * Get template statistics
   */
  getTemplateStats(): any {
    const totalTemplates = this.db.prepare('SELECT COUNT(*) as count FROM templates').get() as { count: number };
    const totalViews = this.db.prepare('SELECT SUM(views) as total FROM templates').get() as { total: number };
    const avgViews = this.db.prepare('SELECT AVG(views) as avg FROM templates').get() as { avg: number };

    // Top used nodes
    const topNodes = this.db.prepare(`
      SELECT value as node, COUNT(*) as count
      FROM templates, json_each(nodes_used)
      GROUP BY value
      ORDER BY count DESC
      LIMIT 10
    `).all() as { node: string; count: number }[];

    return {
      totalTemplates: totalTemplates.count,
      totalViews: totalViews.total || 0,
      averageViews: Math.round(avgViews.avg || 0),
      topUsedNodes: topNodes
    };
  }

  /**
   * Clear all templates
   */
  clearTemplates(): void {
    this.db.exec('DELETE FROM templates');
    if (this.hasFTS5Support) {
      this.db.exec('DELETE FROM templates_fts');
    }
    logger.info('Cleared all templates from database');
  }

  /**
   * Rebuild FTS5 index
   */
  rebuildTemplateFTS(): void {
    if (this.hasFTS5Support) {
      logger.info('Rebuilding FTS5 index for templates...');
      this.db.exec('INSERT INTO templates_fts(templates_fts) VALUES(\'rebuild\')');
      logger.info('FTS5 index rebuilt successfully');
    }
  }

  /**
   * Record template usage
   */
  recordTemplateUsage(templateId: number, workflowName: string, context?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO template_usage (template_id, used_in_workflow, user_context)
      VALUES (?, ?, ?)
    `);
    stmt.run(templateId, workflowName, context || '');
  }

  /**
   * Get template usage statistics
   */
  getTemplateUsageStats(): any {
    const usageStats = this.db.prepare(`
      SELECT COUNT(*) as total_uses,
             COUNT(DISTINCT template_id) as unique_templates_used
      FROM template_usage
    `).get();

    const recentUsage = this.db.prepare(`
      SELECT tu.*, t.name as template_name
      FROM template_usage tu
      JOIN templates t ON tu.template_id = t.id
      ORDER BY tu.used_at DESC
      LIMIT 10
    `).all();

    return {
      totalUses: usageStats.total_uses,
      uniqueTemplatesUsed: usageStats.unique_templates_used,
      recentUsage
    };
  }
}
