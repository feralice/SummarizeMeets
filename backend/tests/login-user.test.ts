import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginUserUseCase } from '../src/use-cases/auth/login-user';
import { IUserRepository } from '../src/domain/repositories/IUserRepository';
import { User } from '../src/domain/entities/User';

const JWT_SECRET = 'test-secret';

const makeUser = async (): Promise<User> => {
  const hashedPassword = await bcrypt.hash('correct-password', 10);
  return new User({
    id: 'user-uuid',
    name: 'João',
    email: 'joao@example.com',
    password: hashedPassword,
  });
};

const makeRepo = (user: User | null): IUserRepository => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn().mockResolvedValue(user),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('LoginUserUseCase', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should return token and user on valid credentials', async () => {
    const user = await makeUser();
    const useCase = new LoginUserUseCase(makeRepo(user));

    const result = await useCase.execute({ email: 'joao@example.com', password: 'correct-password' });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('joao@example.com');

    const decoded = jwt.verify(result.token, JWT_SECRET) as { userId: string };
    expect(decoded.userId).toBe('user-uuid');
  });

  it('should throw on wrong password', async () => {
    const user = await makeUser();
    const useCase = new LoginUserUseCase(makeRepo(user));

    await expect(
      useCase.execute({ email: 'joao@example.com', password: 'wrong-password' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('should throw when user not found', async () => {
    const useCase = new LoginUserUseCase(makeRepo(null));

    await expect(
      useCase.execute({ email: 'unknown@example.com', password: 'any' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('should throw when email or password is missing', async () => {
    const useCase = new LoginUserUseCase(makeRepo(null));

    await expect(useCase.execute({ email: '', password: '' })).rejects.toThrow(
      'Email and password are required',
    );
  });

  it('should throw when JWT_SECRET is not set', async () => {
    delete process.env.JWT_SECRET;
    const user = await makeUser();
    const useCase = new LoginUserUseCase(makeRepo(user));

    await expect(
      useCase.execute({ email: 'joao@example.com', password: 'correct-password' }),
    ).rejects.toThrow('JWT_SECRET not configured');
  });
});
