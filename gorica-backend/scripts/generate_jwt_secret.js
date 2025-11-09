import crypto from 'crypto';

/**
 * Script to generate a secure random JWT secret
 * Usage: node scripts/generate_jwt_secret.js
 */

function generateJWTSecret() {
  // Generate a 64-byte (512-bit) random hex string
  const secret = crypto.randomBytes(64).toString('hex');
  
  console.log('\n🔐 Generated JWT Secret:');
  console.log('='.repeat(80));
  console.log(secret);
  console.log('='.repeat(80));
  console.log('\n📝 Add this to your .env file:');
  console.log(`JWT_SECRET=${secret}`);
  console.log('\n⚠️  IMPORTANT:');
  console.log('   - Keep this secret secure and never commit it to version control');
  console.log('   - Use different secrets for development, staging, and production');
  console.log('   - If you change JWT_SECRET, all existing tokens will be invalidated');
  console.log('   - Users will need to log in again after changing the secret\n');
}

generateJWTSecret();

