import request from 'supertest';
import jwt from 'jsonwebtoken';
import { makeApp } from './helpers/make-app';
import { createMediaRouter } from '../src/interfaces/http/media-upload.router';
import { QueueService } from '../src/infrastructure/queue/queue.service';
import { S3Provider } from '../src/infrastructure/providers/s3/s3-provider';

const JWT_SECRET = 'test-secret';
const validToken = () => jwt.sign({ userId: 'user-uuid' }, JWT_SECRET, { expiresIn: '1h' });

const makeQueueService = (enqueued = true): jest.Mocked<QueueService> =>
  ({ enqueue: jest.fn().mockReturnValue(enqueued) }) as unknown as jest.Mocked<QueueService>;

const makeS3Provider = (): jest.Mocked<S3Provider> =>
  ({
    getUploadUrl: jest.fn().mockResolvedValue({ uploadUrl: 'https://s3.amazonaws.com/presigned', s3Key: 'recordings/user-uuid/file.mp4' }),
    getDownloadUrl: jest.fn(),
    downloadFile: jest.fn(),
  }) as unknown as jest.Mocked<S3Provider>;

// Mock PrismaMeetingRepository so no DB is needed
jest.mock('../src/infrastructure/repositories/PrismaMeetingRepository', () => ({
  PrismaMeetingRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue({ id: 'meeting-uuid', toJSON: () => ({}) }),
    updateStatus: jest.fn(),
  })),
}));

describe('POST /upload-url', () => {
  beforeEach(() => { process.env.JWT_SECRET = JWT_SECRET; });
  afterEach(() => { delete process.env.JWT_SECRET; });

  it('should return uploadUrl and s3Key for a valid mimeType', async () => {
    const app = makeApp(createMediaRouter(makeQueueService(), makeS3Provider()));

    const res = await request(app)
      .post('/upload-url')
      .set('Authorization', `Bearer ${validToken()}`)
      .send({ mimeType: 'video/mp4' });

    expect(res.status).toBe(200);
    expect(res.body.uploadUrl).toContain('s3.amazonaws.com');
    expect(res.body.s3Key).toBe('recordings/user-uuid/file.mp4');
  });

  it('should return 400 when mimeType is missing', async () => {
    const app = makeApp(createMediaRouter(makeQueueService(), makeS3Provider()));

    const res = await request(app)
      .post('/upload-url')
      .set('Authorization', `Bearer ${validToken()}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/mimeType is required/i);
  });

  it('should return 422 for an unsupported mimeType', async () => {
    const app = makeApp(createMediaRouter(makeQueueService(), makeS3Provider()));

    const res = await request(app)
      .post('/upload-url')
      .set('Authorization', `Bearer ${validToken()}`)
      .send({ mimeType: 'application/pdf' });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/unsupported media type/i);
  });

  it('should return 401 without token', async () => {
    const app = makeApp(createMediaRouter(makeQueueService(), makeS3Provider()));

    const res = await request(app).post('/upload-url').send({ mimeType: 'video/mp4' });

    expect(res.status).toBe(401);
  });
});

describe('POST /analyze-media', () => {
  beforeEach(() => { process.env.JWT_SECRET = JWT_SECRET; });
  afterEach(() => { delete process.env.JWT_SECRET; });

  it('should enqueue and return meetingId with status queued', async () => {
    const app = makeApp(createMediaRouter(makeQueueService(true), makeS3Provider()));

    const res = await request(app)
      .post('/analyze-media')
      .set('Authorization', `Bearer ${validToken()}`)
      .send({ s3Key: 'recordings/user-uuid/file.mp4', meetingTitle: 'Daily' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('queued');
    expect(res.body.data.meetingId).toBeDefined();
  });

  it('should return 400 when s3Key is missing', async () => {
    const app = makeApp(createMediaRouter(makeQueueService(), makeS3Provider()));

    const res = await request(app)
      .post('/analyze-media')
      .set('Authorization', `Bearer ${validToken()}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/s3Key is required/i);
  });

  it('should return 503 when queue is full', async () => {
    const app = makeApp(createMediaRouter(makeQueueService(false), makeS3Provider()));

    const res = await request(app)
      .post('/analyze-media')
      .set('Authorization', `Bearer ${validToken()}`)
      .send({ s3Key: 'recordings/user-uuid/file.mp4' });

    expect(res.status).toBe(503);
  });

  it('should return 401 without token', async () => {
    const app = makeApp(createMediaRouter(makeQueueService(), makeS3Provider()));

    const res = await request(app)
      .post('/analyze-media')
      .send({ s3Key: 'recordings/user-uuid/file.mp4' });

    expect(res.status).toBe(401);
  });
});
