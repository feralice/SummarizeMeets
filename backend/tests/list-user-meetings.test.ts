import { ListUserMeetingsUseCase } from '../src/use-cases/meetings/list-user-meetings';
import { IMeetingRepository } from '../src/domain/repositories/IMeetingRepository';
import { Meeting } from '../src/domain/entities/Meeting';

const makeMeeting = (id: string) =>
  new Meeting({
    id,
    meetingTitle: `Meeting ${id}`,
    meetingDate: new Date(),
    summary: {},
    topics: [],
    decisions: [],
    actionItems: [],
    speakers: [],
    status: 'completed',
    userId: 'user-1',
  });

const makeRepo = (meetings: Meeting[]): IMeetingRepository => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn().mockResolvedValue(meetings),
  updateStatus: jest.fn(),
  updateWithResults: jest.fn(),
});

describe('ListUserMeetingsUseCase', () => {
  it('should return meetings for a given userId', async () => {
    const meetings = [makeMeeting('1'), makeMeeting('2')];
    const repo = makeRepo(meetings);
    const useCase = new ListUserMeetingsUseCase(repo);

    const result = await useCase.execute('user-1');

    expect(result).toHaveLength(2);
    expect(repo.findByUserId).toHaveBeenCalledWith('user-1');
  });

  it('should throw when userId is empty', async () => {
    const repo = makeRepo([]);
    const useCase = new ListUserMeetingsUseCase(repo);

    await expect(useCase.execute('')).rejects.toThrow('UserId is required');
  });
});
