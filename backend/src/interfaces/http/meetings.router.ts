import { Router } from 'express';
import { PrismaMeetingRepository } from '../../infrastructure/repositories/PrismaMeetingRepository';
import { ListMeetingsByUserUseCase } from '../../use-cases/meetings/list-by-user';
import { authMiddleware } from './middleware/auth.middleware';

const meetingsRouter = Router();
const meetingRepository = new PrismaMeetingRepository();

// GET /api/history
meetingsRouter.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const useCase = new ListMeetingsByUserUseCase(meetingRepository);
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

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default meetingsRouter;
