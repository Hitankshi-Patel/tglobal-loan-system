import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding loan schemes...');

  const schemes = [
    {
      id: 'PLAN_BULLET_01',
      name: 'Bullet Repayment',
      interestRateAnnual: 12.0,
      maxLtv: 0.70,
      tenureMonths: 12,
      tenureDescription: '12 months, interest + principal at maturity',
      isActive: true,
    },
    {
      id: 'PLAN_EMI_01',
      name: 'Monthly EMI',
      interestRateAnnual: 10.5,
      maxLtv: 0.75,
      tenureMonths: 12,
      tenureDescription: '12 months, equal monthly instalments',
      isActive: true,
    },
  ];

  for (const scheme of schemes) {
    await prisma.loanScheme.upsert({
      where: { id: scheme.id },
      update: scheme,
      create: scheme,
    });
    console.log(`Upserted scheme: ${scheme.id} - ${scheme.name}`);
  }

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
