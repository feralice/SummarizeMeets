import { Router } from 'express';
import { PrismaMeetingRepository } from '../../infrastructure/repositories/PrismaMeetingRepository';
import { ListMeetingsByUserUseCase } from '../../use-cases/meetings/list-by-user';

const meetingsRouter = Router();
const meetingRepository = new PrismaMeetingRepository();

// GET /api/history?userId=<id>
meetingsRouter.get('/history', async (req, res) => {
  try {
    const userId = String(req.query.userId || '');

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    const useCase = new ListMeetingsByUserUseCase(meetingRepository);
    const meetings = await useCase.execute(userId);

    const result = meetings.map((meeting) => ({
      id: meeting.id,
      meetingTitle: meeting.meetingTitle,
      meetingDate: meeting.meetingDate,
      summary: meeting.summary,
      actionPoints: meeting.actionPoints,
      notes: meeting.notes,
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
