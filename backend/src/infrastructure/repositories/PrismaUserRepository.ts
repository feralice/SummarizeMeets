import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { prisma } from '../database/prisma';

export class PrismaUserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const createdUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email.toLowerCase(),
        password: user.password,
      },
    });

    return new User({
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      password: createdUser.password,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
    });
  }

  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map(
      (user) =>
        new User({
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }),
    );
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return new User({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) return null;

    return new User({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'email' | 'password'>>,
  ): Promise<User> {
    const updateData: Record<string, string> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.password) updateData.password = data.password;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return new User({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      password: updatedUser.password,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}
