import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export class FindUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string): Promise<User | null> {
    if (!id) {
      throw new Error('User ID is required');
    }

    return this.userRepository.findById(id);
  }
}
