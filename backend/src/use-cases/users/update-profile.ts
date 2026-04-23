import { User } from '../../domain/entities/User';
import { BadRequestError, NotFoundError } from '../../domain/errors';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

interface UpdateProfileInput {
  name: string;
}

export class UpdateProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, input: UpdateProfileInput): Promise<User> {
    if (!userId) throw new BadRequestError('User ID is required');

    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const name = input.name?.trim();
    if (!name || name.length < 2 || name.length > 120) {
      throw new BadRequestError('Name must be between 2 and 120 characters');
    }

    return this.userRepository.update(userId, { name });
  }
}
