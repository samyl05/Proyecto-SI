import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { normalizeEmail } from '../lib/validation';

async function main() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL ?? 'admin@bi.com');
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      approved: true,
      role: 'ADMIN',
    },
    create: {
      name: 'Administrador',
      email,
      password: passwordHash,
      role: 'ADMIN',
      approved: true,
    },
  });

  console.log('Usuario administrador creado o actualizado:', user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
