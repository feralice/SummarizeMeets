import bcrypt from 'bcrypt';
import { BadRequestError, NotFoundError } from '../../domain/errors';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, input: ChangePasswordInput): Promise<void> {
    if (!userId) throw new BadRequestError('User ID is required');

    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (!input.currentPassword || !input.newPassword) {
      throw new BadRequestError('Current password and new password are required');
    }

    if (input.newPassword.length < 8) {
      throw new BadRequestError('New password must have at least 8 characters');
    }

    const currentPasswordMatches = await bcrypt.compare(input.currentPassword, user.password);
    if (!currentPasswordMatches) {
      throw new BadRequestError('Current password is incorrect');
    }

    const reusingCurrentPassword = await bcrypt.compare(input.newPassword, user.password);
    if (reusingCurrentPassword) {
      throw new BadRequestError('New password must be different from current password');
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 10);
    await this.userRepository.update(userId, { password: hashedPassword });
  }
}
