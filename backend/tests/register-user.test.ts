import jwt from 'jsonwebtoken';
import { RegisterUserUseCase } from '../src/use-cases/auth/register-user';
import { IUserRepository } from '../src/domain/repositories/IUserRepository';
import { User } from '../src/domain/entities/User';

const JWT_SECRET = 'test-secret';

const makeRepo = (existingUser: User | null = null): IUserRepository => {
  const created = new User({ id: 'new-uuid', name: 'João', email: 'joao@example.com', password: 'hashed' });
  return {
    create: jest.fn().mockResolvedValue(created),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(existingUser),
    update: jest.fn(),
    delete: jest.fn(),
  };
};

describe('RegisterUserUseCase', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should create user and return token', async () => {
    const useCase = new RegisterUserUseCase(makeRepo(null));

    const result = await useCase.execute({ name: 'João', email: 'joao@example.com', password: '123456' });

    expect(result.token).toBeDefined();
    expect(result.user.id).toBe('new-uuid');
    expect(result.user.email).toBe('joao@example.com');

    const decoded = jwt.verify(result.token, JWT_SECRET) as { userId: string };
    expect(decoded.userId).toBe('new-uuid');
  });

  it('should throw when email is already in use', async () => {
    const existing = new User({ id: 'old-uuid', name: 'Old', email: 'joao@example.com', password: 'x' });
    const useCase = new RegisterUserUseCase(makeRepo(existing));

    await expect(
      useCase.execute({ name: 'João', email: 'joao@example.com', password: '123456' }),
    ).rejects.toThrow('Email already in use');
  });

  it('should throw when required fields are missing', async () => {
    const useCase = new RegisterUserUseCase(makeRepo(null));

    await expect(
      useCase.execute({ name: '', email: 'joao@example.com', password: '123456' }),
    ).rejects.toThrow('Name, email and password are required');
  });

  it('should throw when JWT_SECRET is not set', async () => {
    delete process.env.JWT_SECRET;
    const useCase = new RegisterUserUseCase(makeRepo(null));

    await expect(
      useCase.execute({ name: 'João', email: 'joao@example.com', password: '123456' }),
    ).rejects.toThrow('JWT_SECRET not configured');
  });
});
