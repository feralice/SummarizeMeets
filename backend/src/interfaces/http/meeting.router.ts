import { Router } from 'express';
import { PrismaMeetingRepository } from '../../infrastructure/repositories/PrismaMeetingRepository';
import { ListUserMeetingsUseCase } from '../../use-cases/meetings/list-user-meetings';
import { GetMeetingDetailsUseCase } from '../../use-cases/meetings/get-meeting-details';
import { S3Provider } from '../../infrastructure/providers/s3/s3-provider';
import { authMiddleware } from './middleware/auth.middleware';
import { constants as HttpStatus } from 'node:http2';

const meetingRouter = Router();
const s3Provider = new S3Provider();

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

/**
 * GET /api/meetings/:id/download-url
 * Generates a pre-signed GET URL so the authenticated user can download
 * the original recording directly from S3.
 */
meetingRouter.get('/:id/download-url', authMiddleware, async (req, res) => {
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

    if (!meeting.s3Key) {
      return res.status(HttpStatus.HTTP_STATUS_NOT_FOUND).json({ error: 'No recording file associated with this meeting' });
    }

    const downloadUrl = await s3Provider.getDownloadUrl(meeting.s3Key);

    return res.status(HttpStatus.HTTP_STATUS_OK).json({ data: { downloadUrl } });
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
