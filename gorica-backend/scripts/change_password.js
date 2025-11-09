import bcrypt from 'bcrypt';
import { query } from '../database/db.js';
import { validatePassword } from '../utils/passwordValidator.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to change a user's password
 * Usage: node scripts/change_password.js <username> <new_password>
 */

async function changePassword() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Usage: node scripts/change_password.js <username> <new_password>');
    console.error('   Example: node scripts/change_password.js doctor MySecurePassword123!');
    process.exit(1);
  }
  
  const [username, newPassword] = args;
  
  // Validate password strength
  const STRICT_VALIDATION = process.env.STRICT_PASSWORD_VALIDATION === 'true' || process.env.NODE_ENV === 'production';
  const passwordValidation = validatePassword(newPassword, STRICT_VALIDATION);
  
  if (!passwordValidation.valid) {
    console.error('❌ Password validation failed:');
    passwordValidation.errors.forEach(error => {
      console.error(`   - ${error}`);
    });
    process.exit(1);
  }
  
  console.log('✅ Password meets security requirements');
  
  try {
    // Check if user exists
    const userCheck = await query(
      'SELECT id, username, role, name FROM users WHERE username = $1',
      [username]
    );
    
    if (userCheck.rows.length === 0) {
      console.error(`❌ User '${username}' not found`);
      process.exit(1);
    }
    
    const user = userCheck.rows[0];
    console.log(`\n👤 Found user: ${user.name} (${user.role})`);
    
    // Hash the new password
    const saltRounds = 10;
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password in database
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE username = $2',
      [passwordHash, username]
    );
    
    console.log(`✅ Password changed successfully for user '${username}'`);
    console.log('\n⚠️  Note: User will need to log in again with the new password.');
    console.log('⚠️  All existing JWT tokens for this user remain valid until they expire.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error changing password:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

changePassword();

