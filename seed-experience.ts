import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Test Experience...');

  // 1. Ensure a User exists
  let user = await prisma.user.findUnique({
    where: { email: 'test-e2e@going.com' }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test-e2e@going.com',
        passwordHash: 'hashed_password',
        name: 'E2E Tester',
        role: 'USER'
      }
    });
    console.log(`✅ Created User: ${user.id}`);
  }

  // 2. Ensure a Host exists for this user
  let host = await prisma.host.findUnique({
    where: { userId: user.id }
  });

  if (!host) {
    host = await prisma.host.create({
      data: {
        userId: user.id,
        name: 'E2E Host',
        isVerified: true
      }
    });
    console.log(`✅ Created Host: ${host.id}`);
  }

  // 3. Create an Experience
  const experience = await prisma.experience.create({
    data: {
      hostId: host.id,
      title: 'E2E Test: Volcanic Adventure',
      description: 'A thrilling journey to the heart of the Cotopaxi volcano.',
      pricePerPerson: 75.00,
      maxCapacity: 12,
      durationHours: 6,
      location: 'Quito, Ecuador',
      status: 'published'
    }
  });

  console.log(`🚀 Created Experience: ${experience.id} - ${experience.title}`);
  return experience;
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
