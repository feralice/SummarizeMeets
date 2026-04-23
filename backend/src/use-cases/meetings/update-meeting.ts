import { Meeting } from '../../domain/entities/Meeting';
import { ForbiddenError, NotFoundError } from '../../domain/errors';
import {
  IMeetingRepository,
  UpdateMeetingFields,
} from '../../domain/repositories/IMeetingRepository';

export class UpdateMeetingUseCase {
  constructor(private meetingRepository: IMeetingRepository) {}

  async execute(id: string, userId: string, fields: UpdateMeetingFields): Promise<Meeting> {
    const meeting = await this.meetingRepository.findById(id);

    if (!meeting) throw new NotFoundError('Meeting not found');
    if (meeting.userId !== userId) throw new ForbiddenError();

    return this.meetingRepository.updateFields(id, fields);
  }
}
