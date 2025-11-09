import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseSQLStatements(sql) {
  const statements = [];
  let current = '';
  let inDoBlock = false;
  let dollarQuote = null;
  
  const lines = sql.split('\n');
  
  for (let line of lines) {
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('--')) {
      continue;
    }
    
    // Check for DO $$ blocks
    if (trimmed.match(/^\s*DO\s+\$\$/i)) {
      inDoBlock = true;
      dollarQuote = '$$';
      current = trimmed;
      continue;
    }
    
    // Check for other dollar-quoted strings
    if (!inDoBlock && trimmed.includes('$$')) {
      const matches = trimmed.match(/\$\$(\w*)\$\$/g);
      if (matches) {
        dollarQuote = matches[0];
        inDoBlock = true;
        current = trimmed;
        continue;
      }
    }
    
    // If in DO block, accumulate until we find the closing $$
    if (inDoBlock) {
      current += '\n' + line;
      if (trimmed.includes(dollarQuote)) {
        statements.push(current);
        current = '';
        inDoBlock = false;
        dollarQuote = null;
      }
      continue;
    }
    
    // Regular statement
    if (trimmed) {
      current += (current ? '\n' : '') + line;
      
      // If line ends with semicolon, it's a complete statement
      if (trimmed.endsWith(';')) {
        statements.push(current);
        current = '';
      }
    }
  }
  
  // Add any remaining statement
  if (current.trim()) {
    statements.push(current);
  }
  
  return statements.filter(s => s.trim() && !s.trim().startsWith('--'));
}

async function addServiceType() {
  try {
    console.log('🔄 Adding service_type column to appointments table...');
    
    const migrationPath = path.join(__dirname, '..', 'database', 'migration_add_service_type.sql');
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
            console.log(`⚠️  Column, constraint, or index already exists, skipping...`);
            continue;
          }
          // Re-throw other errors
          throw error;
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ service_type column has been added to appointments table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

addServiceType();

