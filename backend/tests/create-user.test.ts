import bcrypt from 'bcrypt';
import { CreateUserUseCase } from '../src/use-cases/users/create-user';
import { IUserRepository } from '../src/domain/repositories/IUserRepository';
import { User } from '../src/domain/entities/User';

const makeRepo = (existingUser: User | null = null): IUserRepository => ({
  create: jest.fn().mockImplementation((user: User) =>
    Promise.resolve(new User({ ...user.toJSON(), id: 'created-uuid', password: user.password } as any))
  ),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn().mockResolvedValue(existingUser),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('CreateUserUseCase', () => {
  it('should hash the password before saving', async () => {
    const repo = makeRepo(null);
    const useCase = new CreateUserUseCase(repo);

    await useCase.execute({ name: 'João', email: 'joao@example.com', password: 'plaintext' });

    const createdUser = (repo.create as jest.Mock).mock.calls[0][0] as User;
    const isHashed = await bcrypt.compare('plaintext', createdUser.password);
    expect(isHashed).toBe(true);
  });

  it('should normalize email to lowercase', async () => {
    const repo = makeRepo(null);
    const useCase = new CreateUserUseCase(repo);

    await useCase.execute({ name: 'João', email: 'JOAO@EXAMPLE.COM', password: '123456' });

    const createdUser = (repo.create as jest.Mock).mock.calls[0][0] as User;
    expect(createdUser.email).toBe('joao@example.com');
  });

  it('should throw when email is already in use', async () => {
    const existing = new User({ id: 'x', name: 'Old', email: 'joao@example.com', password: 'hash' });
    const useCase = new CreateUserUseCase(makeRepo(existing));

    await expect(
      useCase.execute({ name: 'João', email: 'joao@example.com', password: '123456' }),
    ).rejects.toThrow('Email already in use');
  });

  it('should throw when any required field is missing', async () => {
    const useCase = new CreateUserUseCase(makeRepo(null));

    await expect(useCase.execute({ name: '', email: 'joao@example.com', password: '123456' })).rejects.toThrow('Name, email and password are required');
    await expect(useCase.execute({ name: 'João', email: '', password: '123456' })).rejects.toThrow('Name, email and password are required');
    await expect(useCase.execute({ name: 'João', email: 'joao@example.com', password: '' })).rejects.toThrow('Name, email and password are required');
  });
});
