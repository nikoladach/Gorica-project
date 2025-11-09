import { query } from '../database/db.js';

async function verifyServiceType() {
  try {
    console.log('🔍 Checking appointments table structure...');
    
    // Check if service_type column exists
    const result = await query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'appointments' 
      AND column_name = 'service_type'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ service_type column does NOT exist in appointments table');
      console.log('⚠️  You need to run the migration: node scripts/add_service_type.js');
      process.exit(1);
    } else {
      const column = result.rows[0];
      console.log('✅ service_type column exists!');
      console.log('   Data type:', column.data_type);
      console.log('   Default value:', column.column_default);
      console.log('   Nullable:', column.is_nullable);
    }
    
    // Check the check constraint
    const constraintResult = await query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%service_type%'
    `);
    
    if (constraintResult.rows.length > 0) {
      console.log('\n✅ Check constraint found:');
      constraintResult.rows.forEach(row => {
        console.log('   Constraint:', row.constraint_name);
        console.log('   Check:', row.check_clause);
      });
    }
    
    // Check existing appointments
    const appointmentsResult = await query(`
      SELECT service_type, COUNT(*) as count
      FROM appointments
      GROUP BY service_type
    `);
    
    console.log('\n📊 Current appointments by service_type:');
    if (appointmentsResult.rows.length === 0) {
      console.log('   No appointments found');
    } else {
      appointmentsResult.rows.forEach(row => {
        console.log(`   ${row.service_type || 'NULL'}: ${row.count} appointment(s)`);
      });
    }
    
    // Test query to make sure it works
    console.log('\n🧪 Testing query with service_type...');
    const testResult = await query(`
      SELECT COUNT(*) as total
      FROM appointments a
      WHERE a.service_type IN ('doctor', 'esthetician') OR a.service_type IS NULL
    `);
    console.log('✅ Query with service_type works!');
    console.log(`   Total appointments: ${testResult.rows[0].total}`);
    
    console.log('\n✅ Database is properly configured for both doctor and esthetician!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying service_type:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

verifyServiceType();

