import { GeminiProvider } from 'src/infrastructure/providers/gemini/gemini-provider';
import { IMeetingRepository } from 'src/domain/repositories/IMeetingRepository';
import { IUserRepository } from 'src/domain/repositories/IUserRepository';
import { Meeting } from 'src/domain/entities/Meeting';
import { User } from 'src/domain/entities/User';

export class AnalyzeVideoUseCase {
  constructor(
    private provider: GeminiProvider,
    private meetingRepository: IMeetingRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(video: Buffer, mime: string, prompt: string, userId: string, title?: string) {
    if (!video) throw new Error('Video is required');
    if (!prompt) throw new Error('Prompt is required');
    if (!userId) throw new Error('UserId is required');

    // Garantir que o usuário existe (para usuários anônimos do localStorage)
    const userExists = await this.userRepository.findById(userId);
    if (!userExists) {
      await this.userRepository.create(new User({
        id: userId,
        name: 'Usuário Anônimo',
        email: `anon-${userId}@summarizemeets.com`,
        password: 'anonymous-user-no-password'
      }));
    }

    const result = await this.provider.analyzeMedia(video, mime, prompt);

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

    return {
      ...result,
      id: savedMeeting.id,
    };
  }
}
