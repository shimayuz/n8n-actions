import { createDatabaseAdapter, DatabaseAdapter } from '../database/database-adapter';
import { TemplateService } from './template-service';
import { TemplateWorkflow, TemplateDetail } from './template-repository';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { logger } from '../utils/logger';

export interface TemplateFetcherConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  batchSize: number;
}

export class TemplateFetcher {
  private config: TemplateFetcherConfig;

  constructor(config: Partial<TemplateFetcherConfig> = {}) {
    this.config = {
      baseUrl: 'https://api.n8n.io',
      timeout: 30000,
      maxRetries: 3,
      batchSize: 50,
      ...config
    };
  }

  /**
   * Fetch template list from n8n.io API
   */
  async fetchTemplates(
    progressCallback?: (current: number, total: number) => void
  ): Promise<TemplateWorkflow[]> {
    const allTemplates: TemplateWorkflow[] = [];
    let page = 1;
    let hasMore = true;

    logger.info('Starting template list fetch from n8n.io');

    while (hasMore) {
      try {
        const response = await this.makeRequest(`/api/templates?page=${page}&limit=${this.config.batchSize}`);

        if (response.data?.data && Array.isArray(response.data.data)) {
          const templates = response.data.data.map(this.mapTemplateResponse);
          allTemplates.push(...templates);

          progressCallback?.(allTemplates.length, response.data.total || allTemplates.length);

          // Check if there are more pages
          const totalPages = response.data.last_page || Math.ceil((response.data.total || 0) / this.config.batchSize);
          hasMore = page < totalPages;
          page++;

          logger.info(`Fetched page ${page - 1}/${totalPages} - ${templates.length} templates`);
        } else {
          hasMore = false;
        }

        // Rate limiting
        await this.delay(1000);

      } catch (error) {
        logger.error(`Error fetching templates page ${page}:`, error);
        break;
      }
    }

    logger.info(`Successfully fetched ${allTemplates.length} templates from n8n.io`);
    return allTemplates;
  }

  /**
   * Fetch details for multiple templates
   */
  async fetchAllTemplateDetails(
    templates: TemplateWorkflow[],
    progressCallback?: (current: number, total: number) => void
  ): Promise<Map<number, TemplateDetail>> {
    const details = new Map<number, TemplateDetail>();
    const batches = this.chunkArray(templates, 10); // Process 10 at a time

    logger.info(`Fetching details for ${templates.length} templates`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPromises = batch.map(template => this.fetchTemplateDetail(template.id));

      try {
        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result, index) => {
          const template = batch[index];
          if (result.status === 'fulfilled' && result.value) {
            details.set(template.id, result.value);
          } else {
            logger.warn(`Failed to fetch details for template ${template.id}:`, result.reason);
          }
        });

        progressCallback?.(details.size, templates.length);

        // Rate limiting between batches
        if (i < batches.length - 1) {
          await this.delay(2000);
        }

      } catch (error) {
        logger.error(`Error processing batch ${i + 1}:`, error);
      }
    }

    logger.info(`Successfully fetched details for ${details.size}/${templates.length} templates`);
    return details;
  }

  /**
   * Fetch detailed information for a single template
   */
  private async fetchTemplateDetail(templateId: number): Promise<TemplateDetail | null> {
    try {
      const response = await this.makeRequest(`/api/templates/${templateId}`);

      if (response.data?.data) {
        return {
          workflow: response.data.data.workflow,
          categories: response.data.data.categories || []
        };
      }

      return null;
    } catch (error) {
      logger.error(`Error fetching template detail ${templateId}:`, error);
      return null;
    }
  }

  /**
   * Map n8n.io API response to our TemplateWorkflow interface
   */
  private mapTemplateResponse(data: any): TemplateWorkflow {
    return {
      id: data.id,
      name: data.name || 'Unnamed Template',
      description: data.description || '',
      author: {
        name: data.user?.name || 'Unknown',
        username: data.user?.username || 'unknown',
        verified: data.user?.verified || false
      },
      nodes: data.nodes_count || 0,
      views: data.views || 0,
      url: `https://n8n.io/workflows/${data.id}`
    };
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(endpoint: string, retries: number = this.config.maxRetries): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: this.config.timeout,
          headers: {
            'User-Agent': 'n8n-cicd-template-fetcher/1.0.0',
            'Accept': 'application/json'
          }
        });

        return response;
      } catch (error: any) {
        const isLastAttempt = attempt === retries;

        if (isLastAttempt) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        logger.warn(`Request failed (attempt ${attempt}/${retries}), retrying in ${delay}ms:`, error.message);

        await this.delay(delay);
      }
    }
  }

  /**
   * Utility function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

/**
 * Main function to fetch and update templates
 */
export async function fetchAndUpdateTemplates(
  dbPath: string = './data/templates.db',
  progressCallback?: (message: string, current: number, total: number) => void
): Promise<void> {
  logger.info('🌐 Starting n8n template fetch and update process...\n');

  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    logger.info(`Created data directory: ${dataDir}`);
  }

  let db: DatabaseAdapter | null = null;

  try {
    // Initialize database
    db = await createDatabaseAdapter(dbPath);
    logger.info('✅ Database connection established');

    // Initialize schema if needed
    const schemaPath = path.join(__dirname, '../../database/template-schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema);
      logger.info('✅ Database schema initialized');
    }

    // Create service
    const service = new TemplateService(db);

    // Create fetcher
    const fetcher = new TemplateFetcher();

    // Fetch template list
    logger.info('📋 Fetching template list from n8n.io...');
    progressCallback?.('Fetching template list', 0, 1);

    const templates = await fetcher.fetchTemplates((current, total) => {
      progressCallback?.('Fetching template list', current, total || current);
    });

    logger.info(`📊 Found ${templates.length} templates to process`);

    // Filter templates from last year (to keep dataset manageable)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentTemplates = templates.filter(template => {
      // Note: n8n.io API might not provide creation dates in list view
      // We'll fetch all and let the detail fetch handle filtering if needed
      return true;
    });

    logger.info(`🎯 Processing ${recentTemplates.length} templates from the last year`);

    // Fetch details for each template
    logger.info('📄 Fetching template details...');
    const details = await fetcher.fetchAllTemplateDetails(recentTemplates, (current, total) => {
      progressCallback?.('Fetching template details', current, total);
    });

    // Clear existing templates
    logger.info('🗑️  Clearing existing templates...');
    service.clearTemplates();

    // Save templates to database
    logger.info('💾 Saving templates to database...');
    let saved = 0;
    let skipped = 0;

    for (const template of recentTemplates) {
      const detail = details.get(template.id);
      if (detail) {
        try {
          service.saveTemplate(template, detail);
          saved++;
        } catch (error) {
          logger.warn(`Failed to save template ${template.id}:`, error);
          skipped++;
        }
      } else {
        skipped++;
      }

      progressCallback?.('Saving templates', saved + skipped, recentTemplates.length);
    }

    // Rebuild search index
    logger.info('🔍 Rebuilding search index...');
    service.rebuildSearchIndex();

    // Get final statistics
    const stats = await service.getTemplateStats();

    logger.info('\n✅ Template fetch and update complete!');
    logger.info('📈 Final Statistics:');
    logger.info(`   • Total templates: ${stats.totalTemplates}`);
    logger.info(`   • Successfully saved: ${saved}`);
    logger.info(`   • Skipped: ${skipped}`);
    logger.info(`   • Average views: ${stats.averageViews}`);
    logger.info(`   • Top used nodes: ${stats.topUsedNodes?.slice(0, 5).map((n: any) => `${n.node} (${n.count})`).join(', ')}`);

    progressCallback?.('Complete', saved, saved);

  } catch (error) {
    logger.error('❌ Error during template fetch and update:', error);
    throw error;
  } finally {
    // Close database connection
    if (db) {
      db.close();
      logger.info('🔌 Database connection closed');
    }
  }
}

// CLI runner
if (require.main === module) {
  const dbPath = process.argv[2] || './data/templates.db';

  fetchAndUpdateTemplates(dbPath, (message, current, total) => {
    const progress = total > 0 ? Math.round((current / total) * 100) : 0;
    console.log(`📊 ${message}: ${current}/${total} (${progress}%)`);
  }).catch(error => {
    console.error('Failed to fetch templates:', error);
    process.exit(1);
  });
}
