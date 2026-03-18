import { Router } from 'express';
import { PrismaMeetingRepository } from '../../infrastructure/repositories/PrismaMeetingRepository';
import { ListUserMeetingsUseCase } from '../../use-cases/meetings/list-user-meetings';
import { authMiddleware } from './middleware/auth.middleware';
import { constants as HttpStatus } from 'node:http2';

const meetingsRouter = Router();
const meetingRepository = new PrismaMeetingRepository();

// GET /api/history
meetingsRouter.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const useCase = new ListUserMeetingsUseCase(meetingRepository);
    const meetings = await useCase.execute(userId!);

    const result = meetings.map((meeting) => ({
      id: meeting.id,
      meetingTitle: meeting.meetingTitle,
      meetingDate: meeting.meetingDate,
      summary: meeting.summary,
      topics: meeting.topics,
      decisions: meeting.decisions,
      actionItems: meeting.actionItems,
      speakers: meeting.speakers,
      status: meeting.status,
      userId: meeting.userId,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    }));

    return res.status(HttpStatus.HTTP_STATUS_OK).json(result);
  } catch (err: any) {
    return res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
});

export default meetingsRouter;
