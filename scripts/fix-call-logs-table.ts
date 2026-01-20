// scripts/fix-call-logs-table.ts
/**
 * Fix call_logs table to remove foreign key constraints
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'surveys.db');

function main() {
  console.log('🔧 Fixing call_logs table...\n');

  const db = new Database(DB_PATH);

  try {
    // Disable foreign keys temporarily
    db.pragma('foreign_keys = OFF');

    // Drop the old table
    console.log('Dropping old call_logs table...');
    db.exec('DROP TABLE IF EXISTS call_logs');

    // Create new table without foreign key constraints
    console.log('Creating new call_logs table without foreign keys...');
    db.exec(`
      CREATE TABLE call_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id TEXT NOT NULL,
        list_id TEXT,
        survey_id TEXT,
        result TEXT NOT NULL,
        notes TEXT,
        duration_seconds INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Recreate indexes
    console.log('Creating indexes...');
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_call_logs_contact ON call_logs(contact_id);
      CREATE INDEX IF NOT EXISTS idx_call_logs_list ON call_logs(list_id);
    `);

    // Re-enable foreign keys
    db.pragma('foreign_keys = ON');

    console.log('\n✅ call_logs table fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing table:', error);
  } finally {
    db.close();
  }
}

main();
