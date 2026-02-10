import { GeminiProvider } from 'src/infrastructure/providers/gemini/gemini-provider';

export class AnalyzeMediaUseCase {
  constructor(private provider: GeminiProvider) {}

  async execute(media: Buffer, mime: string, prompt: string) {
    if (!media) throw new Error('Media file is required');
    if (!prompt) throw new Error('Prompt is required');

    const result = await this.provider.analyzeMedia(media, mime, prompt);

    return result;
  }
}
