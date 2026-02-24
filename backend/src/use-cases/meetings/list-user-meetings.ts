import { IMeetingRepository } from '../../domain/repositories/IMeetingRepository';
import { Meeting } from '../../domain/entities/Meeting';

export class ListUserMeetingsUseCase {
  constructor(private meetingRepository: IMeetingRepository) {}

  async execute(userId: string): Promise<Meeting[]> {
    if (!userId) throw new Error('UserId is required');

    return this.meetingRepository.findByUserId(userId);
  }
}
