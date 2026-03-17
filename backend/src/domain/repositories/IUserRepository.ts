import { User, UserProps } from '../entities/User';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: Partial<Pick<UserProps, 'name' | 'email' | 'password'>>): Promise<User>;
  delete(id: string): Promise<void>;
}
