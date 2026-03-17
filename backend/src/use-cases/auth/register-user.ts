import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { CreateUserUseCase } from '../users/create-user';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface RegisterOutput {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export class RegisterUserUseCase {
  private createUser: CreateUserUseCase;

  constructor(private userRepository: IUserRepository) {
    this.createUser = new CreateUserUseCase(userRepository);
  }

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const user = await this.createUser.execute(input);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

    return {
      token,
      user: { id: user.id!, name: user.name, email: user.email },
    };
  }
}
