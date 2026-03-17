import { Router } from 'express';
import { upload } from 'src/config/multer';
import { withFilters } from './filters/with-filters';
import { PrismaMeetingRepository } from 'src/infrastructure/repositories/PrismaMeetingRepository';
import { validateMediaMimeType } from './filters/validate-media-type';
import { authMiddleware } from './middleware/auth.middleware';
import { QueueService } from 'src/infrastructure/queue/queue.service';
import { Meeting } from 'src/domain/entities/Meeting';
import { constants as HttpStatus } from 'node:http2';
import logger from 'src/infrastructure/logger';

export function createMediaRouter(queueService: QueueService): Router {
  const router = Router();

  router.post(
    '/analyze-media',
    authMiddleware,
    upload.single('media'),
    withFilters([validateMediaMimeType], async (req, res) => {
      try {
        const file = req.file;
        const { title } = req.body;
        const userId = req.userId!;

        if (!file) {
          return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({ error: 'Video file is required' });
        }

        // Create meeting immediately so polling can start right away
        const meetingRepository = new PrismaMeetingRepository();
        const meeting = await meetingRepository.create(new Meeting({
          meetingTitle: title || 'Nova Reunião',
          meetingDate: new Date(),
          summary: {},
          topics: [],
          decisions: [],
          actionItems: [],
          speakers: [],
          status: 'queued',
          userId,
        }));

        const enqueued = queueService.enqueue({
          meetingId: meeting.id!,
          fileBuffer: file.buffer,
          mimeType: file.mimetype,
          userId,
          title: title || 'Nova Reunião',
        });

        if (!enqueued) {
          // Mark as failed since we can't process it
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
        logger.error({ err, userId: req.userId }, 'Media upload failed');
        return res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: err.message });
      }
    })
  );

  return router;
}
