import { QueueService, QueueJob } from '../src/infrastructure/queue/queue.service';

const makeJob = (id: string): QueueJob => ({
  meetingId: id,
  s3Key: `recordings/user/${id}.mp4`,
  userId: 'user-1',
  title: `Meeting ${id}`,
});

describe('QueueService', () => {
  describe('enqueue', () => {
    it('should return true and process a job', async () => {
      const processor = jest.fn<Promise<void>, [QueueJob]>().mockResolvedValue(undefined);
      const queue = new QueueService(processor);

      const result = queue.enqueue(makeJob('1'));

      expect(result).toBe(true);
      await new Promise((r) => setTimeout(r, 10));
      expect(processor).toHaveBeenCalledTimes(1);
      expect(processor).toHaveBeenCalledWith(makeJob('1'));
    });

    it('should reject when queue depth exceeds MAX_QUEUE_DEPTH', () => {
      const processor = jest.fn<Promise<void>, [QueueJob]>(() => new Promise(() => {})); // never resolves
      const queue = new QueueService(processor);

      // Fill MAX_CONCURRENT (2) active + MAX_QUEUE_DEPTH (5) waiting = 7 total
      for (let i = 0; i < 7; i++) queue.enqueue(makeJob(`${i}`));

      const rejected = queue.enqueue(makeJob('overflow'));
      expect(rejected).toBe(false);
    });

    it('should report correct stats', () => {
      const processor = jest.fn<Promise<void>, [QueueJob]>(() => new Promise(() => {}));
      const queue = new QueueService(processor);

      queue.enqueue(makeJob('a'));
      queue.enqueue(makeJob('b'));
      queue.enqueue(makeJob('c'));

      // 2 active, 1 waiting
      expect(queue.stats).toEqual({ active: 2, waiting: 1 });
    });

    it('should process next job after one completes', async () => {
      const resolvers: Record<string, () => void> = {};

      // All jobs block until manually resolved
      const processor = jest.fn<Promise<void>, [QueueJob]>().mockImplementation(
        (job: QueueJob) => new Promise<void>((r) => { resolvers[job.meetingId] = r; })
      );

      const queue = new QueueService(processor);
      queue.enqueue(makeJob('1')); // active slot 1
      queue.enqueue(makeJob('2')); // active slot 2
      queue.enqueue(makeJob('3')); // waiting — both slots occupied

      await new Promise((r) => setTimeout(r, 10));
      // '3' not started yet — both concurrent slots are busy
      expect(queue.stats).toEqual({ active: 2, waiting: 1 });

      resolvers['1'](); // free one slot
      await new Promise((r) => setTimeout(r, 10));

      // '3' should now be active
      expect(queue.stats.waiting).toBe(0);
      expect(processor).toHaveBeenCalledWith(expect.objectContaining({ meetingId: '3' }));
    });
  });
});
