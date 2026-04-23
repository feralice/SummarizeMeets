import { Router } from 'express';
import { constants as HttpStatus } from 'node:http2';
import { z } from 'zod';
import { PrismaMeetingRepository } from '../../infrastructure/repositories/PrismaMeetingRepository';
import { S3Provider } from '../../infrastructure/providers/s3/s3-provider';
import logger from '../../infrastructure/logger';
import { DeleteMeetingUseCase } from '../../use-cases/meetings/delete-meeting';
import { GetMeetingDetailsUseCase } from '../../use-cases/meetings/get-meeting-details';
import { ListUserMeetingsUseCase } from '../../use-cases/meetings/list-user-meetings';
import { UpdateMeetingUseCase } from '../../use-cases/meetings/update-meeting';
import { authMiddleware } from './middleware/auth.middleware';
import { handleHttpError } from './middleware/http-errors';

const meetingRouter = Router();

const meetingRepository = new PrismaMeetingRepository();
const s3Provider = new S3Provider();

const optionalDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();

const updateMeetingSchema = z
  .object({
    meetingTitle: z.string().trim().min(1).max(200).optional(),
    summary: z
      .object({
        introduction: z.string().trim().min(1),
        key_points: z.array(z.string().trim().min(1)),
        conclusion: z.string().trim().min(1),
      })
      .optional(),
    topics: z
      .array(
        z.object({
          title: z.string().trim().min(1),
          description: z.string().trim().min(1),
        })
      )
      .optional(),
    decisions: z.array(z.string().trim().min(1)).optional(),
    actionItems: z
      .array(
        z.object({
          task: z.string().trim().min(1),
          responsible: z.string().trim().nullable(),
          deadline: optionalDateSchema,
          needs_review: z.boolean(),
        })
      )
      .optional(),
    speakers: z
      .array(
        z.object({
          speaker: z.string().trim().min(1),
          description: z.string().trim().min(1),
        })
      )
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });

meetingRouter.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.userId) {
      logger.warn({ userId, requesterId: req.userId }, 'Forbidden: list meetings');
      return res.status(HttpStatus.HTTP_STATUS_FORBIDDEN).json({ error: 'Forbidden' });
    }

    const meetings = await new ListUserMeetingsUseCase(meetingRepository).execute(userId);
    logger.info({ userId, count: meetings.data.length }, 'Meetings listed');
    return res.status(HttpStatus.HTTP_STATUS_OK).json({ data: meetings.data });
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'Error listing meetings');
    return handleHttpError(err, res);
  }
});

meetingRouter.get('/:id/download-url', authMiddleware, async (req, res) => {
  try {
    const id = req.params['id'] as string;
    const meeting = await new GetMeetingDetailsUseCase(meetingRepository).execute(id);

    if (!meeting) {
      return res.status(HttpStatus.HTTP_STATUS_NOT_FOUND).json({ error: 'Meeting not found' });
    }

    if (meeting.userId !== req.userId) {
      logger.warn({ meetingId: id, requesterId: req.userId }, 'Forbidden: download url');
      return res.status(HttpStatus.HTTP_STATUS_FORBIDDEN).json({ error: 'Forbidden' });
    }

    if (!meeting.s3Key) {
      return res.status(HttpStatus.HTTP_STATUS_NOT_FOUND).json({ error: 'No recording file associated with this meeting' });
    }

    const downloadUrl = await s3Provider.getDownloadUrl(meeting.s3Key);
    logger.info({ meetingId: id, userId: req.userId }, 'Download URL generated');
    return res.status(HttpStatus.HTTP_STATUS_OK).json({ data: { downloadUrl } });
  } catch (err) {
    logger.error({ err, meetingId: req.params['id'], userId: req.userId }, 'Error generating download URL');
    return handleHttpError(err, res);
  }
});

meetingRouter.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params['id'] as string;
    const parsed = updateMeetingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({
        error: 'Invalid meeting update payload',
        details: parsed.error.issues,
      });
    }

    const updated = await new UpdateMeetingUseCase(meetingRepository).execute(id, req.userId!, parsed.data);
    logger.info({ meetingId: id, userId: req.userId }, 'Meeting updated');
    return res.status(HttpStatus.HTTP_STATUS_OK).json({ data: updated });
  } catch (err) {
    logger.error({ err, meetingId: req.params['id'], userId: req.userId }, 'Error updating meeting');
    return handleHttpError(err, res);
  }
});

meetingRouter.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params['id'] as string;
    await new DeleteMeetingUseCase(meetingRepository).execute(id, req.userId!);
    logger.info({ meetingId: id, userId: req.userId }, 'Meeting deleted');
    return res.status(HttpStatus.HTTP_STATUS_NO_CONTENT).send();
  } catch (err) {
    logger.error({ err, meetingId: req.params['id'], userId: req.userId }, 'Error deleting meeting');
    return handleHttpError(err, res);
  }
});

meetingRouter.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params['id'] as string;
    const meeting = await new GetMeetingDetailsUseCase(meetingRepository).execute(id);

    if (!meeting) {
      return res.status(HttpStatus.HTTP_STATUS_NOT_FOUND).json({ error: 'Meeting not found' });
    }

    if (meeting.userId !== req.userId) {
      logger.warn({ meetingId: id, requesterId: req.userId }, 'Forbidden: get meeting details');
      return res.status(HttpStatus.HTTP_STATUS_FORBIDDEN).json({ error: 'Forbidden' });
    }

    return res.status(HttpStatus.HTTP_STATUS_OK).json({ data: meeting });
  } catch (err) {
    logger.error({ err, meetingId: req.params['id'], userId: req.userId }, 'Error fetching meeting');
    return handleHttpError(err, res);
  }
});

export default meetingRouter;
