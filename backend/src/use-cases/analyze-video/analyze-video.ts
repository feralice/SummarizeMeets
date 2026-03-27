import { GeminiProvider } from '../../infrastructure/providers/gemini/gemini-provider';
import { S3Provider } from '../../infrastructure/providers/s3/s3-provider';
import { AnalysisResults } from '../../domain/repositories/IMeetingRepository';
import { MEETING_ANALYSIS_PROMPT } from '../../core/constants/meeting-analysis.prompt';
import logger from '../../infrastructure/logger';

export class AnalyzeVideoUseCase {
  constructor(
    private provider: GeminiProvider,
    private s3Provider: S3Provider,
  ) {}

  async execute(meetingId: string, s3Key: string): Promise<AnalysisResults> {
    if (!s3Key) throw new Error('s3Key is required');
    if (!meetingId) throw new Error('Meeting ID is required');

    logger.info({ meetingId, s3Key }, 'Downloading media from S3');
    const { buffer, mimeType } = await this.s3Provider.downloadFile(s3Key);

    logger.info({ meetingId, mimeType, fileSizeBytes: buffer.byteLength }, 'Starting media analysis');

    const result = await this.provider.analyzeMedia(buffer, mimeType, MEETING_ANALYSIS_PROMPT);
    logger.info(
      { meetingId, topicsCount: result.topics.length, actionItemsCount: result.action_items.length },
      'Gemini analysis completed'
    );

    return {
      summary: result.summary,
      topics: result.topics,
      decisions: result.decisions,
      actionItems: result.action_items,
      speakers: result.speakers,
    };
  }
}
