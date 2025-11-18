import { GeminiProvider } from "src/infrastructure/providers/gemini/gemini-provider";

export class AnalyzeVideoUseCase {
  constructor(private provider: GeminiProvider) {}

  async execute(video: Buffer, mime: string, prompt: string) {
    if (!video) throw new Error('Video is required');
    if (!prompt) throw new Error('Prompt is required');

    return await this.provider.analyzeVideo(video, mime, prompt);
  }
}
