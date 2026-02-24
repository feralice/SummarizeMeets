import { Router } from 'express';
import { PrismaMeetingRepository } from 'src/infrastructure/repositories/PrismaMeetingRepository';
import { ListUserMeetingsUseCase } from 'src/use-cases/meetings/list-user-meetings';
import { GetMeetingDetailsUseCase } from 'src/use-cases/meetings/get-meeting-details';

const meetingRouter = Router();

meetingRouter.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const meetingRepository = new PrismaMeetingRepository();
    const usecase = new ListUserMeetingsUseCase(meetingRepository);

    const meetings = await usecase.execute(userId);

    return res.status(200).json({
      data: meetings,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

meetingRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const meetingRepository = new PrismaMeetingRepository();
    const usecase = new GetMeetingDetailsUseCase(meetingRepository);

    const meeting = await usecase.execute(id);

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    return res.status(200).json({
      data: meeting,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default meetingRouter;
