import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testConnection() {
  try {
    console.log('Testando conexão com o banco de dados...\n');

    // Testar conexão
    await prisma.$connect();
    console.log('Conexão estabelecida com sucesso!\n');

    // Verificar tabelas
    console.log('Verificando estrutura do banco...\n');

    // Criar usuário de teste
    const user = await prisma.user.create({
      data: {
        name: 'João Teste',
        email: 'joao.teste@example.com',
        password: 'senha123',
      },
    });
    console.log('Usuário criado:', user);

    // Criar reunião de teste
    const meeting = await prisma.meeting.create({
      data: {
        meetingTitle: 'Reunião de Teste',
        meetingDate: new Date(),
        summary: 'Esta é uma reunião de teste para validar o banco de dados.',
        actionPoints: '- Validar estrutura\n- Testar relacionamentos',
        notes: 'Notas adicionais sobre a reunião',
        userId: user.id,
      },
    });
    console.log('Reunião criada:', meeting);

    // Buscar usuário com reuniões
    const userWithMeetings = await prisma.user.findUnique({
      where: { id: user.id },
      include: { meetings: true },
    });
    console.log('\nUsuário com reuniões:', JSON.stringify(userWithMeetings, null, 2));

    // Limpar dados de teste
    await prisma.meeting.deleteMany();
    await prisma.user.deleteMany();
    console.log('\nDados de teste removidos com sucesso!');

    console.log('\nTodos os testes passaram! O banco está funcionando corretamente.\n');

  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
