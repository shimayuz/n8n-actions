import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export interface DatabaseAdapter {
  exec(sql: string): void;
  prepare(sql: string): any;
  checkFTS5Support(): boolean;
  close(): void;
}

export class SQLiteAdapter implements DatabaseAdapter {
  private db: Database.Database;
  private hasFTS5: boolean = false;

  constructor(dbPath: string) {
    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.checkFTS5Support();
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  prepare(sql: string): any {
    return this.db.prepare(sql);
  }

  checkFTS5Support(): boolean {
    if (this.hasFTS5 !== undefined) {
      return this.hasFTS5;
    }

    try {
      // Try to create a test FTS5 table
      this.db.exec('CREATE VIRTUAL TABLE IF NOT EXISTS fts5_test USING fts5(content)');
      this.db.exec('DROP TABLE IF EXISTS fts5_test');
      this.hasFTS5 = true;
    } catch (error) {
      this.hasFTS5 = false;
    }

    return this.hasFTS5;
  }

  close(): void {
    if (this.db) {
      this.db.close();
    }
  }

  // Transaction support
  transaction<T>(fn: () => T): T {
    const transaction = this.db.transaction(fn);
    return transaction();
  }

  // Get database stats
  getStats(): { tables: number; size: number } {
    const tableCount = this.db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get() as { count: number };
    const dbStats = fs.statSync(this.db.name);
    return {
      tables: tableCount.count,
      size: dbStats.size
    };
  }
}

export async function createDatabaseAdapter(dbPath: string): Promise<DatabaseAdapter> {
  const adapter = new SQLiteAdapter(dbPath);

  // Enable WAL mode for better concurrency
  adapter.exec('PRAGMA journal_mode = WAL');
  adapter.exec('PRAGMA synchronous = NORMAL');
  adapter.exec('PRAGMA cache_size = 1000000'); // 1GB cache
  adapter.exec('PRAGMA temp_store = memory');

  return adapter;
}
