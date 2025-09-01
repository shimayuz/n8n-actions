-- n8n Template Management Database Schema
-- SQLite database for storing n8n workflow templates

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_username TEXT NOT NULL,
  author_verified INTEGER DEFAULT 0,
  nodes_used TEXT NOT NULL, -- JSON array of node types
  workflow_json TEXT NOT NULL, -- Complete workflow JSON
  categories TEXT, -- JSON array of categories
  views INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  url TEXT,
  scraped_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Templates FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS templates_fts USING fts5(
  name, description, content=templates,
  tokenize = 'porter ascii'
);

-- FTS5 triggers to keep search index in sync
CREATE TRIGGER IF NOT EXISTS templates_ai AFTER INSERT ON templates BEGIN
  INSERT INTO templates_fts(rowid, name, description)
  VALUES (new.id, new.name, new.description);
END;

CREATE TRIGGER IF NOT EXISTS templates_au AFTER UPDATE ON templates BEGIN
  UPDATE templates_fts SET name = new.name, description = new.description
  WHERE rowid = new.id;
END;

CREATE TRIGGER IF NOT EXISTS templates_ad AFTER DELETE ON templates BEGIN
  DELETE FROM templates_fts WHERE rowid = old.id;
END;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_templates_workflow_id ON templates(workflow_id);
CREATE INDEX IF NOT EXISTS idx_templates_author_username ON templates(author_username);
CREATE INDEX IF NOT EXISTS idx_templates_views ON templates(views DESC);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);

-- Template usage tracking
CREATE TABLE IF NOT EXISTS template_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  used_at TEXT DEFAULT CURRENT_TIMESTAMP,
  used_in_workflow TEXT, -- Name of workflow that used this template
  user_context TEXT, -- Additional context about usage
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

-- Template categories for classification
CREATE TABLE IF NOT EXISTS template_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many relationship between templates and categories
CREATE TABLE IF NOT EXISTS template_category_relations (
  template_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (template_id, category_id),
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES template_categories(id) ON DELETE CASCADE
);

-- Insert default categories
INSERT OR IGNORE INTO template_categories (name, description) VALUES
('ai_automation', 'AI-powered automation workflows'),
('data_sync', 'Data synchronization and integration'),
('webhook_processing', 'Webhook handling and processing'),
('email_automation', 'Email processing and automation'),
('slack_integration', 'Slack messaging integration'),
('data_transformation', 'Data processing and transformation'),
('file_processing', 'File upload, download, and processing'),
('scheduling', 'Scheduled task automation'),
('api_integration', 'REST API and webhook integrations'),
('database_operations', 'Database CRUD operations'),
('chatbot', 'Conversational AI and chatbots'),
('reporting', 'Data reporting and analytics'),
('notification', 'Multi-channel notifications'),
('workflow_orchestration', 'Complex workflow orchestration'),
('error_handling', 'Error monitoring and handling');

-- Template metadata for enhanced search
CREATE TABLE IF NOT EXISTS template_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  UNIQUE(template_id, key)
);

-- Template ratings and feedback
CREATE TABLE IF NOT EXISTS template_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  feedback TEXT,
  rated_by TEXT, -- User identifier
  rated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);
