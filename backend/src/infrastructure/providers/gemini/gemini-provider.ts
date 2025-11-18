import { GoogleGenAI } from '@google/genai';

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

  async analyzeVideo(videoBuffer: Buffer, mimeType: string, prompt: string) {
    const arrayBuffer = bufferToArrayBuffer(videoBuffer);

    const blob = new Blob([arrayBuffer], { type: mimeType });

    let uploaded = await this.ai.files.upload({
      file: blob,
      config: { mimeType },
    });

    console.log('Uploaded:', uploaded);

    while (!uploaded.state || uploaded.state.toString() !== 'ACTIVE') {
      console.log('Processando vídeo...');
      await new Promise((res) => setTimeout(res, 2000));
      uploaded = await this.ai.files.get({ name: uploaded.name ?? '' });
    }

    const result = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                fileUri: uploaded.uri,
                mimeType: uploaded.mimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    return result?.text ?? '';
  }
}
