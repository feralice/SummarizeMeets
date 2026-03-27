import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Pool and client are created on first use — not at import time.
// This allows app-config.ts to populate DATABASE_URL before prisma initializes.
let _client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!_client) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    _client = new PrismaClient({ adapter });
  }
  return _client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await getClient().$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await getClient().$disconnect();
  console.log('Database disconnected');
};
