const { PrismaClient } = require('d:/erp1/backend/node_modules/@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@erp.uz';
  const password = 'SuperAdmin123!';

  const existing = await prisma.saaSAdmin.findUnique({
    where: { email }
  });

  if (existing) {
    console.log('Super Admin account already exists:', email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const saasAdmin = await prisma.saaSAdmin.create({
    data: {
      email,
      passwordHash,
      twoFactorEnabled: false
    }
  });

  console.log('==============================================');
  console.log('Super Admin account created successfully!');
  console.log('Email:', saasAdmin.email);
  console.log('Password:', password);
  console.log('Status: 2FA is currently disabled for setup.');
  console.log('==============================================');
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
