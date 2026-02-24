import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const defaultUserEmail = 'test@example.com';
  const defaultUserName = 'Usuário de Teste';
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: defaultUserEmail },
    update: {},
    create: {
      email: defaultUserEmail,
      name: defaultUserName,
      password: hashedPassword,
    },
  });

  console.log('Seed: Usuário de teste criado/verificado:', {
    id: user.id,
    name: user.name,
    email: user.email
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
