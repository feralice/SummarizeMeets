import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export class ListUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
