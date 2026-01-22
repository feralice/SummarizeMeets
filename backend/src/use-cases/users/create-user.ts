import bcrypt from 'bcrypt';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const { name, email, password } = input;

    if (!name || !email || !password) {
      throw new Error('Name, email and password are required');
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return this.userRepository.create(user);
  }
}
