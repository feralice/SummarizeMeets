import { AnalyzeVideoUseCase } from '../src/use-cases/analyze-video/analyze-video';
import { GeminiProvider } from '../src/infrastructure/providers/gemini/gemini-provider';
import { S3Provider } from '../src/infrastructure/providers/s3/s3-provider';

const makeGeminiProvider = (overrides: Partial<GeminiProvider> = {}): jest.Mocked<GeminiProvider> =>
  ({
    analyzeMedia: jest.fn().mockResolvedValue({
      summary: { introduction: 'Intro', key_points: ['point'], conclusion: 'End' },
      topics: [{ title: 'Topic 1', description: 'Desc' }],
      decisions: ['Decision 1'],
      action_items: [{ task: 'Do something now', responsible: null, deadline: null, needs_review: true }],
      speakers: [{ speaker: 'João', description: 'Host' }],
    }),
    ...overrides,
  }) as unknown as jest.Mocked<GeminiProvider>;

const makeS3Provider = (overrides: Partial<S3Provider> = {}): jest.Mocked<S3Provider> =>
  ({
    downloadFile: jest.fn().mockResolvedValue({ buffer: Buffer.from('data'), mimeType: 'video/mp4' }),
    getUploadUrl: jest.fn(),
    getDownloadUrl: jest.fn(),
    ...overrides,
  }) as unknown as jest.Mocked<S3Provider>;

describe('AnalyzeVideoUseCase', () => {
  it('should download from S3 and return analysis results', async () => {
    const gemini = makeGeminiProvider();
    const s3 = makeS3Provider();
    const useCase = new AnalyzeVideoUseCase(gemini, s3);

    const result = await useCase.execute('meeting-1', 'recordings/user/file.mp4');

    expect(s3.downloadFile).toHaveBeenCalledWith('recordings/user/file.mp4');
    expect(gemini.analyzeMedia).toHaveBeenCalledWith(
      expect.any(Buffer),
      'video/mp4',
      expect.any(String),
    );
    expect(result.summary).toEqual({ introduction: 'Intro', key_points: ['point'], conclusion: 'End' });
    expect(result.topics).toHaveLength(1);
    expect(result.decisions).toEqual(['Decision 1']);
    expect(result.actionItems).toHaveLength(1);
    expect(result.speakers).toHaveLength(1);
  });

  it('should throw when s3Key is empty', async () => {
    const useCase = new AnalyzeVideoUseCase(makeGeminiProvider(), makeS3Provider());

    await expect(useCase.execute('meeting-1', '')).rejects.toThrow('s3Key is required');
  });

  it('should throw when meetingId is empty', async () => {
    const useCase = new AnalyzeVideoUseCase(makeGeminiProvider(), makeS3Provider());

    await expect(useCase.execute('', 'recordings/user/file.mp4')).rejects.toThrow('Meeting ID is required');
  });

  it('should propagate S3 errors', async () => {
    const s3 = makeS3Provider({ downloadFile: jest.fn().mockRejectedValue(new Error('S3 unavailable')) });
    const useCase = new AnalyzeVideoUseCase(makeGeminiProvider(), s3);

    await expect(useCase.execute('meeting-1', 'recordings/user/file.mp4')).rejects.toThrow('S3 unavailable');
  });

  it('should propagate Gemini errors', async () => {
    const gemini = makeGeminiProvider({ analyzeMedia: jest.fn().mockRejectedValue(new Error('Gemini timeout')) });
    const useCase = new AnalyzeVideoUseCase(gemini, makeS3Provider());

    await expect(useCase.execute('meeting-1', 'recordings/user/file.mp4')).rejects.toThrow('Gemini timeout');
  });
});
