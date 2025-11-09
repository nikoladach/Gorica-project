import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseSQLStatements(sql) {
  const statements = [];
  let currentStatement = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inComment = false;
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1] || '';
    const prevChar = sql[i - 1] || '';
    
    // Handle line comments
    if (char === '-' && nextChar === '-' && !inDollarQuote && !inSingleQuote && !inDoubleQuote) {
      inComment = true;
      currentStatement += char;
      continue;
    }
    
    if (inComment) {
      currentStatement += char;
      if (char === '\n') {
        inComment = false;
      }
      continue;
    }
    
    // Handle dollar-quoted strings (for PostgreSQL functions)
    if (char === '$' && !inSingleQuote && !inDoubleQuote) {
      // Match dollar quotes: $$ or $tag$...$tag$
      const dollarMatch = sql.substring(i).match(/^\$([^$]*)\$/);
      if (dollarMatch) {
        const fullMatch = dollarMatch[0];
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = fullMatch;
        } else if (fullMatch === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
        }
        currentStatement += fullMatch;
        i += fullMatch.length - 1;
        continue;
      }
    }
    
    // Handle single quotes
    if (char === "'" && !inDollarQuote && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    }
    
    // Handle double quotes
    if (char === '"' && !inDollarQuote && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    }
    
    currentStatement += char;
    
    // Split on semicolon only if not inside quotes
    if (char === ';' && !inDollarQuote && !inSingleQuote && !inDoubleQuote) {
      const trimmed = currentStatement.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        statements.push(trimmed);
      }
      currentStatement = '';
    }
  }
  
  // Add any remaining statement
  const trimmed = currentStatement.trim();
  if (trimmed && !trimmed.startsWith('--')) {
    statements.push(trimmed);
  }
  
  return statements;
}

async function migrate() {
  try {
    console.log('🔄 Running database migration...');
    
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Parse SQL statements properly handling PostgreSQL functions
    const statements = parseSQLStatements(schema);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (error) {
          // Ignore "already exists" errors for triggers and other objects
          // These are expected when re-running migrations
          if (error.code === '42710' || error.code === '42P07') {
            console.log(`⚠️  Object already exists, skipping: ${error.message.split('\n')[0]}`);
            continue;
          }
          // Re-throw other errors
          throw error;
        }
      }
    }
    
    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

