import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../database/db.js';
import bcrypt from 'bcrypt';

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

async function addUsers() {
  try {
    console.log('🔄 Adding users table for authentication...');
    
    const migrationPath = path.join(__dirname, '..', 'database', 'migration_add_users.sql');
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
    
    // Create default users (doctor and esthetician)
    console.log('\n👤 Creating default users...');
    
    const defaultUsers = [
      { username: 'doctor', password: 'doctor', role: 'doctor', name: 'Doctor' },
      { username: 'esthetician', password: 'esthetician', role: 'esthetician', name: 'Esthetician' },
    ];
    
    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const existing = await query(
          'SELECT id FROM users WHERE username = $1',
          [userData.username]
        );
        
        if (existing.rows.length > 0) {
          console.log(`⚠️  User '${userData.username}' already exists, skipping...`);
          continue;
        }
        
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(userData.password, saltRounds);
        
        // Create user
        await query(
          `INSERT INTO users (username, password_hash, role, name)
           VALUES ($1, $2, $3, $4)`,
          [userData.username, passwordHash, userData.role, userData.name]
        );
        
        console.log(`✅ Created user: ${userData.username} (${userData.role})`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.username}:`, error.message);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('✅ Users table has been created');
    console.log('\n📝 Default users created:');
    console.log('   - doctor / doctor (role: doctor)');
    console.log('   - esthetician / esthetician (role: esthetician)');
    console.log('\n⚠️  IMPORTANT: Change default passwords in production!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

addUsers();

