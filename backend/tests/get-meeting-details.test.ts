import { GetMeetingDetailsUseCase } from '../src/use-cases/meetings/get-meeting-details';
import { IMeetingRepository } from '../src/domain/repositories/IMeetingRepository';
import { Meeting } from '../src/domain/entities/Meeting';

const makeMeeting = (id: string) =>
  new Meeting({
    id,
    meetingTitle: 'Daily',
    meetingDate: new Date(),
    summary: {},
    topics: [],
    decisions: [],
    actionItems: [],
    speakers: [],
    status: 'completed',
    userId: 'user-1',
  });

const makeRepo = (meeting: Meeting | null): IMeetingRepository => ({
  create: jest.fn(),
  findById: jest.fn().mockResolvedValue(meeting),
  findByUserId: jest.fn(),
  updateStatus: jest.fn(),
  updateWithResults: jest.fn(),
});

describe('GetMeetingDetailsUseCase', () => {
  it('should return the meeting when found', async () => {
    const meeting = makeMeeting('abc');
    const useCase = new GetMeetingDetailsUseCase(makeRepo(meeting));

    const result = await useCase.execute('abc');

    expect(result).toBe(meeting);
    expect(result?.meetingTitle).toBe('Daily');
  });

  it('should return null when meeting does not exist', async () => {
    const useCase = new GetMeetingDetailsUseCase(makeRepo(null));

    const result = await useCase.execute('nonexistent');

    expect(result).toBeNull();
  });

  it('should throw when id is empty', async () => {
    const useCase = new GetMeetingDetailsUseCase(makeRepo(null));

    await expect(useCase.execute('')).rejects.toThrow('Meeting id is required');
  });
});
