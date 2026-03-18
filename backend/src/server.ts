import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createMediaRouter } from './interfaces/http/media-upload.router';
import userRouter from './interfaces/http/user.router';
import meetingRouter from './interfaces/http/meeting.router';
import meetingsRouter from './interfaces/http/meetings.router';
import authRouter from './interfaces/http/auth.router';
import logger from './infrastructure/logger';
import { QueueService, QueueJob } from './infrastructure/queue/queue.service';
import { GeminiProvider } from './infrastructure/providers/gemini/gemini-provider';
import { PrismaMeetingRepository } from './infrastructure/repositories/PrismaMeetingRepository';
import { AnalyzeVideoUseCase } from './use-cases/analyze-video/analyze-video';

dotenv.config();
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Wire queue with processor callback — QueueService never imports use-cases directly
const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY!);
const meetingRepository = new PrismaMeetingRepository();

const queueService = new QueueService(async (job: QueueJob) => {
  await meetingRepository.updateStatus(job.meetingId, 'processing');
  try {
    const useCase = new AnalyzeVideoUseCase(geminiProvider);
    const results = await useCase.execute(job.meetingId, job.fileBuffer, job.mimeType);
    await meetingRepository.updateWithResults(job.meetingId, results);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await meetingRepository.updateStatus(job.meetingId, 'failed', errorMessage);
    throw err; // re-throw so QueueService logs it
  }
});

app.use('/api', authRouter);
app.use('/api', createMediaRouter(queueService));
app.use('/api', userRouter);
app.use('/api', meetingsRouter);
app.use('/api/meetings', meetingRouter);

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Server started');
});
