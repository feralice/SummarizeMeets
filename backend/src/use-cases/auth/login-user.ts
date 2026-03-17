import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

interface LoginInput {
  email: string;
  password: string;
}

interface LoginOutput {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export class LoginUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const { email, password } = input;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

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
