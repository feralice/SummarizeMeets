import { GoogleGenAI } from '@google/genai';
import { extractJson } from 'src/infrastructure/utils/extract-json';
import { MeetingAnalysisSchema } from 'src/interfaces/schemas/analyze-media.schema';

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

      console.log(`Processing media file... (attempt ${attempt})`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  async analyzeMedia(
    mediaBuffer: Buffer,
    mimeType: string,
    prompt: string,
    model: string = 'gemini-3-flash'
  ) {
    const arrayBuffer = bufferToArrayBuffer(mediaBuffer);
    const blob = new Blob([arrayBuffer], { type: mimeType });

    const uploaded = await this.ai.files.upload({
      file: blob,
      config: { mimeType },
    });

    console.log('Media uploaded:', uploaded.name);

    if (!uploaded.name) {
      throw new Error("File upload did not return a 'name' property");
    }

    const activeFile = await this.waitForFileActive(uploaded.name);

    console.log('Media file processed and active!');

    const result = await this.ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                fileUri: activeFile.uri,
                mimeType: activeFile.mimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const rawText = result.text ?? '';

    try {
      const parsed = extractJson(rawText);
      return MeetingAnalysisSchema.parse(parsed);
    } catch (error) {
      console.error('Gemini response:', rawText);
      throw new Error('Gemini returned invalid JSON');
    }
  }
}
