import { prisma } from '../lib/prisma';

async function main() {
  const count = await prisma.student.count();
  console.log('Conexión exitosa. Registros actuales:', count);
}

main()
  .catch((e) => console.error('Error de conexión:', e))
  .finally(() => process.exit());
