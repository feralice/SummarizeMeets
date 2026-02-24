import { IMeetingRepository } from '../../domain/repositories/IMeetingRepository';
import { Meeting } from '../../domain/entities/Meeting';

export class GetMeetingDetailsUseCase {
  constructor(private meetingRepository: IMeetingRepository) {}

  async execute(id: string): Promise<Meeting | null> {
    if (!id) throw new Error('Meeting id is required');

    return this.meetingRepository.findById(id);
  }
}
