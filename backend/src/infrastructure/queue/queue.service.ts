import logger from 'src/infrastructure/logger';

export interface QueueJob {
  meetingId: string;
  fileBuffer: Buffer;
  mimeType: string;
  userId: string;
  title: string;
}

type JobProcessor = (job: QueueJob) => Promise<void>;

export class QueueService {
  // Waiting jobs (not yet picked up by a worker)
  // NOTE: MAX_QUEUE_DEPTH limits this array. Active jobs (being processed) are
  // tracked separately via activeJobs counter, so the true in-flight maximum is
  // MAX_QUEUE_DEPTH (waiting) + MAX_CONCURRENT (active). Both limits are
  // conservative for EC2 t3.micro (1GB RAM) given expected MVP file sizes of
  // 50–500MB per job.
  private queue: QueueJob[] = [];
  private activeJobs = 0;

  private readonly MAX_CONCURRENT = 2;
  private readonly MAX_QUEUE_DEPTH = 5;

  constructor(private readonly processor: JobProcessor) {}

  enqueue(job: QueueJob): boolean {
    if (this.queue.length >= this.MAX_QUEUE_DEPTH) {
      logger.warn(
        { userId: job.userId, meetingId: job.meetingId, queueLength: this.queue.length },
        'Queue full — job rejected'
      );
      return false;
    }

    this.queue.push(job);
    logger.info(
      { userId: job.userId, meetingId: job.meetingId, queueLength: this.queue.length },
      'Job enqueued'
    );
    this.processNext();
    return true;
  }

  private processNext(): void {
    if (this.activeJobs >= this.MAX_CONCURRENT) return;
    const job = this.queue.shift();
    if (!job) return;

    // Increment SYNCHRONOUSLY before the first await to prevent race conditions
    // when multiple enqueue() calls arrive in the same event loop tick.
    this.activeJobs++;
    this.processJob(job);
  }

  private async processJob(job: QueueJob): Promise<void> {
    logger.info({ userId: job.userId, meetingId: job.meetingId }, 'Processing job started');
    try {
      await this.processor(job);
      logger.info({ userId: job.userId, meetingId: job.meetingId }, 'Processing job completed');
    } catch (err) {
      logger.error({ err, userId: job.userId, meetingId: job.meetingId }, 'Processing job failed');
    } finally {
      this.activeJobs--;
      this.processNext();
    }
  }

  get stats() {
    return { waiting: this.queue.length, active: this.activeJobs };
  }
}
