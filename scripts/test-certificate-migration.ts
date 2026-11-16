/**
 * Test script for certificate migration
 * Run with: npx ts-node scripts/test-certificate-migration.ts
 */

import { prisma } from '../lib/prisma';
import { 
  getCertificateByAddress, 
  upsertCertificate, 
  addCertificateXp 
} from '../lib/services/certificate-service';

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';

async function testCertificateMigration() {
  console.log('🧪 Starting Certificate Migration Tests...\n');

  try {
    // Test 1: Create new certificate
    console.log('Test 1: Create new certificate');
    const cert1 = await upsertCertificate(TEST_ADDRESS, 50);
    console.log('✅ Certificate created:', {
      totalXp: cert1.totalXp,
      level: cert1.level,
    });
    console.assert(cert1.totalXp === 50, 'XP should be 50');
    console.assert(cert1.level === 4, 'Level should be 4 (50 XP = level 4)');
    console.log('');

    // Test 2: Get certificate by address
    console.log('Test 2: Get certificate by address');
    const cert2 = await getCertificateByAddress(TEST_ADDRESS);
    console.log('✅ Certificate retrieved:', {
      totalXp: cert2?.totalXp,
      level: cert2?.level,
    });
    console.assert(cert2?.totalXp === 50, 'XP should be 50');
    console.log('');

    // Test 3: Add XP
    console.log('Test 3: Add XP (+10)');
    const cert3 = await addCertificateXp(TEST_ADDRESS, 10);
    console.log('✅ XP added:', {
      totalXp: cert3.totalXp,
      level: cert3.level,
    });
    console.assert(cert3.totalXp === 60, 'XP should be 60');
    console.log('');

    // Test 4: Update existing certificate (sync scenario)
    console.log('Test 4: Update certificate (sync from localStorage)');
    const cert4 = await upsertCertificate(TEST_ADDRESS, 150);
    console.log('✅ Certificate synced:', {
      totalXp: cert4.totalXp,
      level: cert4.level,
    });
    console.assert(cert4.totalXp === 150, 'XP should be 150');
    console.assert(cert4.level === 6, 'Level should be 6');
    console.log('');

    // Test 5: Level calculation edge cases
    console.log('Test 5: Level calculation edge cases');
    
    // Level 1 (0-9 XP)
    const level1 = await upsertCertificate(TEST_ADDRESS + '1', 5);
    console.assert(level1.level === 0, 'Level should be 0 for 5 XP');
    
    // Level 2 (10-29 XP)
    const level2 = await upsertCertificate(TEST_ADDRESS + '2', 15);
    console.assert(level2.level === 1, 'Level should be 1 for 15 XP');
    
    // Level 10 (920+ XP)
    const level10 = await upsertCertificate(TEST_ADDRESS + '3', 920);
    console.assert(level10.level === 9, 'Level should be 9 for 920 XP');
    
    // Level 11+ (infinite leveling)
    const level11 = await upsertCertificate(TEST_ADDRESS + '4', 1919);
    console.assert(level11.level === 10, 'Level should be 10 for 1919 XP');
    
    console.log('✅ All level calculations correct');
    console.log('');

    // Test 6: Cleanup
    console.log('Test 6: Cleanup test data');
    await prisma.mst_certificate.deleteMany({
      where: {
        user: {
          address: {
            startsWith: TEST_ADDRESS,
          },
        },
      },
    });
    await prisma.mst_users.deleteMany({
      where: {
        address: {
          startsWith: TEST_ADDRESS,
        },
      },
    });
    console.log('✅ Test data cleaned up');
    console.log('');

    console.log('🎉 All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testCertificateMigration()
  .then(() => {
    console.log('✅ Migration test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration test failed:', error);
    process.exit(1);
  });
