import { ForbiddenError, NotFoundError } from '../../domain/errors';
import { IMeetingRepository } from '../../domain/repositories/IMeetingRepository';

export class DeleteMeetingUseCase {
  constructor(private meetingRepository: IMeetingRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const meeting = await this.meetingRepository.findById(id);

    if (!meeting) throw new NotFoundError('Meeting not found');
    if (meeting.userId !== userId) throw new ForbiddenError();

    await this.meetingRepository.delete(id);
  }
}
