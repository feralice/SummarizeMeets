import bcrypt from 'bcrypt';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
}

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, input: UpdateUserInput): Promise<User> {
    if (!id) {
      throw new Error('User ID is required');
    }

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    if (input.email) {
      const userWithEmail = await this.userRepository.findByEmail(input.email);
      if (userWithEmail && userWithEmail.id !== id) {
        throw new Error('Email already in use');
      }
    }

    const updateData: Partial<Pick<User, 'name' | 'email' | 'password'>> = {};
    if (input.name) updateData.name = input.name;
    if (input.email) updateData.email = input.email.toLowerCase();
    if (input.password) updateData.password = await bcrypt.hash(input.password, 10);

    return this.userRepository.update(id, updateData);
  }
}
