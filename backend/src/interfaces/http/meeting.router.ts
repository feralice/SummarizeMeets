import { Router } from 'express';
import { PrismaMeetingRepository } from 'src/infrastructure/repositories/PrismaMeetingRepository';
import { ListUserMeetingsUseCase } from 'src/use-cases/meetings/list-user-meetings';
import { GetMeetingDetailsUseCase } from 'src/use-cases/meetings/get-meeting-details';
import { authMiddleware } from './middleware/auth.middleware';
import { constants as HttpStatus } from 'node:http2';

const meetingRouter = Router();

meetingRouter.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.userId) {
      return res.status(HttpStatus.HTTP_STATUS_FORBIDDEN).json({ error: 'Forbidden' });
    }

    const meetingRepository = new PrismaMeetingRepository();
    const usecase = new ListUserMeetingsUseCase(meetingRepository);

    const meetings = await usecase.execute(userId);

    return res.status(HttpStatus.HTTP_STATUS_OK).json({
      data: meetings,
    });
  } catch (err: any) {
    return res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
});

meetingRouter.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params['id'] as string;
    const meetingRepository = new PrismaMeetingRepository();
    const usecase = new GetMeetingDetailsUseCase(meetingRepository);

    const meeting = await usecase.execute(id);

    if (!meeting) {
      return res.status(HttpStatus.HTTP_STATUS_NOT_FOUND).json({ error: 'Meeting not found' });
    }

    if (meeting.userId !== req.userId) {
      return res.status(HttpStatus.HTTP_STATUS_FORBIDDEN).json({ error: 'Forbidden' });
    }

    return res.status(HttpStatus.HTTP_STATUS_OK).json({
      data: meeting,
    });
  } catch (err: any) {
    return res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
});

export default meetingRouter;
