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

async function fixUniqueConstraint() {
  try {
    console.log('🔄 Fixing unique constraint to include service_type...');
    
    const migrationPath = path.join(__dirname, '..', 'database', 'migration_fix_unique_constraint.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Parse SQL statements properly handling PostgreSQL DO blocks
    const statements = parseSQLStatements(migrationSQL);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
          console.log('✅ Executed:', statement.substring(0, 80).replace(/\n/g, ' ') + '...');
        } catch (error) {
          // Ignore "does not exist" errors for dropping constraint
          if (error.message.includes('does not exist') || error.code === '42704') {
            console.log(`⚠️  Constraint does not exist, skipping drop...`);
            continue;
          }
          // Ignore "already exists" errors for creating constraint
          if (error.code === '42710' || error.code === '42P07' || error.message.includes('already exists')) {
            console.log(`⚠️  Constraint already exists, skipping...`);
            continue;
          }
          // Re-throw other errors
          throw error;
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('✅ Unique constraint now includes service_type');
    console.log('✅ Both doctor and esthetician can now have appointments at the same time slot');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

fixUniqueConstraint();

