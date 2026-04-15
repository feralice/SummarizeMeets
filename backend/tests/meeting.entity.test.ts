import { Meeting, MeetingProps } from '../src/domain/entities/Meeting';

const baseProps: MeetingProps = {
  id: 'uuid-1',
  meetingTitle: 'Daily',
  meetingDate: new Date('2026-04-14'),
  summary: { introduction: 'Intro', key_points: [], conclusion: 'End' },
  topics: [],
  decisions: [],
  actionItems: [],
  speakers: [],
  status: 'pending',
  userId: 'user-1',
};

describe('Meeting entity', () => {
  it('should expose props via getters', () => {
    const meeting = new Meeting(baseProps);

    expect(meeting.id).toBe('uuid-1');
    expect(meeting.meetingTitle).toBe('Daily');
    expect(meeting.status).toBe('pending');
    expect(meeting.userId).toBe('user-1');
    expect(meeting.s3Key).toBeUndefined();
    expect(meeting.errorMessage).toBeUndefined();
  });

  it('should default status to "pending" when not provided', () => {
    const { status, ...rest } = baseProps;
    const meeting = new Meeting({ ...rest, status: '' });
    expect(meeting.status).toBe('pending');
  });

  it('should store s3Key when provided', () => {
    const meeting = new Meeting({ ...baseProps, s3Key: 'recordings/user-1/file.mp4' });
    expect(meeting.s3Key).toBe('recordings/user-1/file.mp4');
  });

  it('should return all fields in toJSON()', () => {
    const meeting = new Meeting({ ...baseProps, s3Key: 'key', errorMessage: 'oops' });
    const json = meeting.toJSON();

    expect(json).toMatchObject({
      id: 'uuid-1',
      meetingTitle: 'Daily',
      status: 'pending',
      s3Key: 'key',
      errorMessage: 'oops',
      userId: 'user-1',
    });
  });
});
