import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdPricing() {
  try {
    console.log('Updating all ad pricing to 1 $PUNK...');
    
    const result = await prisma.ads_pricing.updateMany({
      data: {
        price: 1
      }
    });
    
    console.log(`✓ Updated ${result.count} pricing packages to 1 $PUNK`);
    
    // Show current pricing
    const packages = await prisma.ads_pricing.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    
    console.log('\nCurrent pricing:');
    packages.forEach(pkg => {
      console.log(`  - ${pkg.name}: ${pkg.price} $PUNK (${pkg.durationHours}h)`);
    });
    
  } catch (error) {
    console.error('Error updating pricing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdPricing();
