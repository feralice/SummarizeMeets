import { Router } from 'express';
import { authMiddleware } from './middleware/auth.middleware';
import { PrismaMeetingRepository } from '../../infrastructure/repositories/PrismaMeetingRepository';
import { S3Provider } from '../../infrastructure/providers/s3/s3-provider';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { Meeting } from '../../domain/entities/Meeting';
import { constants as HttpStatus } from 'node:http2';
import logger from '../../infrastructure/logger';

const ALLOWED_MIME_TYPES = [
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4',
];

export function createMediaRouter(queueService: QueueService, s3Provider: S3Provider): Router {
  const router = Router();

  /**
   * POST /api/upload-url
   * Generates a pre-signed PUT URL for the browser to upload directly to S3.
   * Body: { mimeType: string }
   * Returns: { uploadUrl: string, s3Key: string }
   */
  router.post('/upload-url', authMiddleware, async (req, res) => {
    try {
      const { mimeType } = req.body as { mimeType?: string };
      const userId = req.userId!;

      if (!mimeType) {
        return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({ error: 'mimeType is required' });
      }

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return res.status(HttpStatus.HTTP_STATUS_UNPROCESSABLE_ENTITY).json({
          error: `Unsupported media type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        });
      }

      const { uploadUrl, s3Key } = await s3Provider.getUploadUrl(mimeType, userId);

      return res.status(HttpStatus.HTTP_STATUS_OK).json({ uploadUrl, s3Key });
    } catch (err: any) {
      logger.error({ err, userId: req.userId }, 'Failed to generate upload URL');
      return res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  });

  /**
   * POST /api/analyze-media
   * Notifies the backend that the file is already in S3 and ready to be analysed.
   * Body: { s3Key: string, meetingTitle?: string }
   * Returns: { meetingId: string, status: 'queued' }
   */
  router.post('/analyze-media', authMiddleware, async (req, res) => {
    try {
      const { s3Key, meetingTitle } = req.body as { s3Key?: string; meetingTitle?: string };
      const userId = req.userId!;

      if (!s3Key) {
        return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({ error: 's3Key is required' });
      }

      const meetingRepository = new PrismaMeetingRepository();
      const meeting = await meetingRepository.create(new Meeting({
        meetingTitle: meetingTitle || 'Nova Reunião',
        meetingDate: new Date(),
        summary: {},
        topics: [],
        decisions: [],
        actionItems: [],
        speakers: [],
        status: 'queued',
        s3Key,
        userId,
      }));

      const enqueued = queueService.enqueue({
        meetingId: meeting.id!,
        s3Key,
        userId,
        title: meetingTitle || 'Nova Reunião',
      });

      if (!enqueued) {
        await meetingRepository.updateStatus(meeting.id!, 'failed');
        logger.warn({ userId }, 'Queue full — request rejected');
        return res.status(HttpStatus.HTTP_STATUS_SERVICE_UNAVAILABLE).json({
          error: 'Servidor ocupado, tente em alguns instantes',
        });
      }

      return res.status(HttpStatus.HTTP_STATUS_OK).json({
        data: { meetingId: meeting.id, status: 'queued' },
      });
    } catch (err: any) {
      logger.error({ err, userId: req.userId }, 'analyze-media failed');
      return res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  });

  return router;
}
