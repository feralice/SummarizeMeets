import { GeminiProvider } from 'src/infrastructure/providers/gemini/gemini-provider';
import { AnalysisResults } from 'src/domain/repositories/IMeetingRepository';
import { MEETING_ANALYSIS_PROMPT } from 'src/core/constants/meeting-analysis.prompt';
import logger from 'src/infrastructure/logger';

export class AnalyzeVideoUseCase {
  constructor(private provider: GeminiProvider) {}

  async execute(meetingId: string, video: Buffer, mime: string): Promise<AnalysisResults> {
    if (!video) throw new Error('Video is required');
    if (!meetingId) throw new Error('Meeting ID is required');

    logger.info({ meetingId, mimeType: mime, fileSizeBytes: video.byteLength }, 'Starting media analysis');

    logger.info({ meetingId }, 'Sending media to Gemini');
    const result = await this.provider.analyzeMedia(video, mime, MEETING_ANALYSIS_PROMPT);
    logger.info(
      { meetingId, topicsCount: result.topics.length, actionItemsCount: result.action_items.length },
      'Gemini analysis completed'
    );

    // Map Gemini's snake_case action_items → camelCase actionItems
    return {
      summary: result.summary,
      topics: result.topics,
      decisions: result.decisions,
      actionItems: result.action_items,
      speakers: result.speakers,
    };
  }
}
