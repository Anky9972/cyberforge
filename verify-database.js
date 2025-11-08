// 🔍 Database Verification Script
// Run with: node verify-database.js

const { PrismaClient } = require('@prisma/client');

async function verifyDatabase() {
  console.log('🔍 FuzzForge Database Verification\n');
  console.log('=' .repeat(50));
  
  const prisma = new PrismaClient();
  
  try {
    // Test 1: Check database connection
    console.log('\n✓ Test 1: Database Connection');
    await prisma.$connect();
    console.log('  ✅ Connected to database successfully');
    
    // Test 2: Check if User table exists
    console.log('\n✓ Test 2: User Table');
    const userCount = await prisma.user.count();
    console.log(`  ✅ User table exists (${userCount} users)`);
    
    // Test 3: Check if Analysis table exists (if added)
    console.log('\n✓ Test 3: Analysis Table');
    try {
      const analysisCount = await prisma.analysis.count();
      console.log(`  ✅ Analysis table exists (${analysisCount} analyses)`);
    } catch (error) {
      console.log('  ⚠️  Analysis table not found');
      console.log('  📝 Need to run: npx prisma migrate dev --name add_analysis_model');
    }
    
    // Test 4: Test write operation (if user exists)
    if (userCount > 0) {
      console.log('\n✓ Test 4: Write Test');
      const testUser = await prisma.user.findFirst();
      
      try {
        const testAnalysis = await prisma.analysis.create({
          data: {
            userId: testUser.id,
            filename: 'test.js',
            timestamp: new Date(),
            severity: 'Medium',
            vulnerabilitiesFound: 0,
            analysesRun: ['test'],
            duration: 1,
            status: 'completed',
            reportData: { test: true }
          }
        });
        console.log('  ✅ Write test successful');
        
        // Clean up test data
        await prisma.analysis.delete({
          where: { id: testAnalysis.id }
        });
        console.log('  ✅ Cleanup successful');
      } catch (error) {
        console.log('  ⚠️  Write test failed (table may not exist)');
      }
    }
    
    // Test 5: Check indexes
    console.log('\n✓ Test 5: Database Schema');
    const result = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;
    console.log('  ✅ Available tables:', result.map(r => r.tablename).join(', '));
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Database verification complete!\n');
    
  } catch (error) {
    console.error('\n❌ Database verification failed:');
    console.error(error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check DATABASE_URL in .env file');
    console.error('2. Ensure PostgreSQL is running');
    console.error('3. Run: npx prisma migrate dev');
    console.error('4. Run: npx prisma generate');
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyDatabase()
  .catch(console.error)
  .finally(() => process.exit());
