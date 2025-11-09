import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../database/db.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse SQL statements, handling PostgreSQL DO $$ blocks
 */
function parseSQLStatements(sql) {
  const statements = [];
  let currentStatement = '';
  let inDoBlock = false;
  let dollarQuoteTag = '';
  let inDollarQuote = false;
  
  const lines = sql.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for DO $$ blocks
    if (line.trim().match(/^\s*DO\s+\$\$/i)) {
      inDoBlock = true;
      dollarQuoteTag = '$$';
      currentStatement += line + '\n';
      continue;
    }
    
    // Check for DO $tag$ blocks
    if (line.trim().match(/^\s*DO\s+\$(\w+)\$/i)) {
      const match = line.trim().match(/^\s*DO\s+\$(\w+)\$/i);
      inDoBlock = true;
      dollarQuoteTag = `$${match[1]}$`;
      currentStatement += line + '\n';
      continue;
    }
    
    // Check for dollar quote end
    if (inDoBlock && line.includes(dollarQuoteTag)) {
      currentStatement += line + '\n';
      if (line.trim().endsWith(dollarQuoteTag)) {
        inDoBlock = false;
        statements.push(currentStatement.trim());
        currentStatement = '';
        dollarQuoteTag = '';
      }
      continue;
    }
    
    if (inDoBlock) {
      currentStatement += line + '\n';
      continue;
    }
    
    // Regular SQL statement handling
    currentStatement += line + '\n';
    
    // Check if line ends with semicolon (end of statement)
    if (line.trim().endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  return statements.filter(s => s.trim() && !s.trim().startsWith('--'));
}

async function addPhysicianReports() {
  try {
    console.log('📋 Running migration: Add Physician Reports Table...\n');
    
    const migrationPath = path.join(__dirname, '..', 'database', 'migration_add_physician_reports.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Parse SQL statements properly handling PostgreSQL DO blocks
    const statements = parseSQLStatements(migrationSQL);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
          console.log('✅ Executed:', statement.substring(0, 80).replace(/\n/g, ' ') + '...');
        } catch (error) {
          // Ignore "already exists" errors
          if (error.code === '42710' || error.code === '42P07' || error.message.includes('already exists')) {
            console.log(`⚠️  Object already exists, skipping...`);
            continue;
          }
          // Re-throw other errors
          throw error;
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('✅ Physician reports table has been created');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

addPhysicianReports();

