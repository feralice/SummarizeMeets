import { Meeting } from '../../domain/entities/Meeting';
import { IMeetingRepository } from '../../domain/repositories/IMeetingRepository';

export class ListMeetingsByUserUseCase {
  constructor(private meetingRepository: IMeetingRepository) {}

  async execute(userId: string): Promise<Meeting[]> {
    return this.meetingRepository.findByUserId(userId);
  }
}
