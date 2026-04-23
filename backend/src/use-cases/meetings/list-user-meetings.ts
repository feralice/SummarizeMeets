import {
  IMeetingRepository,
  MeetingFilters,
  MeetingPagination,
  PaginatedMeetings,
} from '../../domain/repositories/IMeetingRepository';

export class ListUserMeetingsUseCase {
  constructor(private meetingRepository: IMeetingRepository) {}

  async execute(
    userId: string,
    filters?: MeetingFilters,
    pagination?: MeetingPagination
  ): Promise<PaginatedMeetings> {
    if (!userId) throw new Error('UserId is required');

    return this.meetingRepository.findByUserId(userId, filters, pagination);
  }
}
