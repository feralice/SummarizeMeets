import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { loadConfig } from './infrastructure/config/app-config';
import logger from './infrastructure/logger';
import { createMediaRouter } from './interfaces/http/media-upload.router';
import userRouter from './interfaces/http/user.router';
import meetingRouter from './interfaces/http/meeting.router';
import meetingsRouter from './interfaces/http/meetings.router';
import authRouter from './interfaces/http/auth.router';
import { QueueService, QueueJob } from './infrastructure/queue/queue.service';
import { GeminiProvider } from './infrastructure/providers/gemini/gemini-provider';
import { S3Provider } from './infrastructure/providers/s3/s3-provider';
import { PrismaMeetingRepository } from './infrastructure/repositories/PrismaMeetingRepository';
import { AnalyzeVideoUseCase } from './use-cases/analyze-video/analyze-video';

async function main() {
  await loadConfig();

  const PORT = parseInt(process.env.PORT || '3000', 10);

  const app = express();
  app.use(express.json());
  app.use(cors());
  app.use(helmet());
  app.use(morgan('dev'));

  // Wire queue with processor callback — QueueService never imports use-cases directly
  const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY!);
  const s3Provider = new S3Provider();
  const meetingRepository = new PrismaMeetingRepository();

  const queueService = new QueueService(async (job: QueueJob) => {
    await meetingRepository.updateStatus(job.meetingId, 'processing');
    try {
      const useCase = new AnalyzeVideoUseCase(geminiProvider, s3Provider);
      const results = await useCase.execute(job.meetingId, job.s3Key);
      await meetingRepository.updateWithResults(job.meetingId, results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await meetingRepository.updateStatus(job.meetingId, 'failed', errorMessage);
      throw err;
    }
  });

  app.use('/api', authRouter);
  app.use('/api', createMediaRouter(queueService, s3Provider));
  app.use('/api', userRouter);
  app.use('/api', meetingsRouter);
  app.use('/api/meetings', meetingRouter);

  app.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV || 'local' }, 'Server started');
  });
}

main().catch((err) => {
  console.error('Fatal: failed to start server', err);
  process.exit(1);
});
