import { GoogleGenAI } from '@google/genai';
import { extractJson } from 'src/infrastructure/utils/extract-json';
import { MeetingAnalysisSchema } from 'src/interfaces/schemas/analyze-media.schema';
import logger from 'src/infrastructure/logger';

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; i++) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

export class GeminiProvider {
  private ai;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  private async waitForFileActive(name: string) {
    let attempt = 0;

    while (true) {
      const file = await this.ai.files.get({ name });

      if (file.state === 'ACTIVE') {
        return file;
      }

      attempt++;
      const delay = Math.min(6000 * attempt, 1500);

      logger.debug({ attempt, fileName: name }, 'Waiting for media file to become active');
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  private handleGeminiError(err: any): never {
    const status = err?.status ?? err?.error?.status ?? err?.error?.code;
    const message = err?.message ?? err?.error?.message ?? '';

    if (status === 503 || status === 'UNAVAILABLE' || message.includes('high demand') || message.includes('UNAVAILABLE')) {
      logger.warn({ status, originalMessage: message }, 'Gemini unavailable (503)');
      throw new Error('O serviço de IA está temporariamente sobrecarregado. Aguarde alguns instantes e tente novamente.');
    }

    if (status === 429 || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
      logger.warn({ status, originalMessage: message }, 'Gemini quota exceeded (429)');
      throw new Error('Limite de requisições atingido. Tente novamente em alguns minutos.');
    }

    if (status === 400 || message.includes('INVALID_ARGUMENT')) {
      logger.warn({ status, originalMessage: message }, 'Gemini rejected file (400)');
      throw new Error('O arquivo enviado não pôde ser processado pelo serviço de IA. Verifique o formato e tente novamente.');
    }

    logger.error({ status, originalMessage: message, err }, 'Unexpected Gemini API error');
    throw new Error('Erro inesperado no serviço de IA. Tente novamente.');
  }

  async analyzeMedia(
    mediaBuffer: Buffer,
    mimeType: string,
    prompt: string,
    model: string = 'gemini-3-flash-preview'
  ) {
    const arrayBuffer = bufferToArrayBuffer(mediaBuffer);
    const blob = new Blob([arrayBuffer], { type: mimeType });

    let uploaded;
    try {
      uploaded = await this.ai.files.upload({ file: blob, config: { mimeType } });
      logger.info({ fileName: uploaded.name }, 'Media uploaded to Gemini');
    } catch (err: any) {
      this.handleGeminiError(err);
    }

    if (!uploaded!.name) {
      throw new Error("File upload did not return a 'name' property");
    }

    const activeFile = await this.waitForFileActive(uploaded!.name);
    logger.info({ fileName: activeFile.name }, 'Media file active, generating content');

    let result;
    try {
      result = await this.ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { fileData: { fileUri: activeFile.uri, mimeType: activeFile.mimeType } },
              { text: prompt },
            ],
          },
        ],
      });
    } catch (err: any) {
      this.handleGeminiError(err);
    }

    const rawText = result!.text ?? '';

    try {
      const parsed = extractJson(rawText);
      return MeetingAnalysisSchema.parse(parsed);
    } catch (error) {
      logger.error({ rawText }, 'Gemini returned invalid or unparseable JSON');
      throw new Error('A IA retornou uma resposta inválida. Tente novamente.');
    }
  }
}
