const { PrismaClient } = require('d:/erp1/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const branchName = process.argv[2];
  if (!branchName) {
    console.error('Xatolik: Iltimos, filial nomini kiriting!');
    console.log('Masalan: node scripts/add_branch.js "Market - Chilonzor"');
    process.exit(1);
  }

  // Find the first active company
  const company = await prisma.company.findFirst({
    where: { status: 'ACTIVE' }
  });

  if (!company) {
    console.error('Xatolik: Faol kompaniya topilmadi!');
    process.exit(1);
  }

  // Create a new branch
  const newBranch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: branchName,
      address: 'O\'zbekiston, Toshkent sh.',
      isDefault: false,
      status: 'ACTIVE'
    }
  });

  console.log('==============================================');
  console.log('Filial muvaffaqiyatli qo\'shildi!');
  console.log('ID:', newBranch.id);
  console.log('Nomi:', newBranch.name);
  console.log('Kompaniya:', company.name);
  console.log('==============================================');
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
