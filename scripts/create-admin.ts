import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const email = 'admin@bi.com';
  const password = 'admin123';

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: password,
    },
    create: {
      name: 'Administrador',
      email,
      password: password,
      role: 'ADMIN',
    },
  });

  console.log('Usuario admin creado:', user.email);
}

main()
  .catch((e) => console.error(e))
  .finally(() => process.exit());
