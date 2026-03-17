import { GeminiProvider } from 'src/infrastructure/providers/gemini/gemini-provider';
import { IMeetingRepository } from 'src/domain/repositories/IMeetingRepository';
import { Meeting } from 'src/domain/entities/Meeting';
import logger from 'src/infrastructure/logger';

export class AnalyzeVideoUseCase {
  constructor(
    private provider: GeminiProvider,
    private meetingRepository: IMeetingRepository
  ) {}

  async execute(video: Buffer, mime: string, prompt: string, userId: string, title?: string) {
    if (!video) throw new Error('Video is required');
    if (!prompt) throw new Error('Prompt is required');
    if (!userId) throw new Error('UserId is required');

    logger.info({ userId, mimeType: mime, fileSizeBytes: video.byteLength, title }, 'Starting media analysis');

    logger.info({ userId }, 'Sending media to Gemini');
    const result = await this.provider.analyzeMedia(video, mime, prompt);
    logger.info({ userId, topicsCount: result.topics.length, actionItemsCount: result.action_items.length }, 'Gemini analysis completed');

    const meeting = new Meeting({
      meetingTitle: title || 'Nova Reunião',
      meetingDate: new Date(),
      summary: result.summary,
      topics: result.topics,
      decisions: result.decisions,
      actionItems: result.action_items,
      speakers: result.speakers,
      status: 'completed',
      userId,
    });

    const savedMeeting = await this.meetingRepository.create(meeting);
    logger.info({ userId, meetingId: savedMeeting.id }, 'Meeting saved successfully');

    return {
      ...result,
      id: savedMeeting.id,
    };
  }
}
