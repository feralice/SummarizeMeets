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

  private async waitForFileActive(name: string) {
    let attempt = 0;

    while (true) {
      const file = await this.ai.files.get({ name });

      if (file.state === 'ACTIVE') {
        return file;
      }

      attempt++;
      const delay = Math.min(6000 * attempt, 15000);

      console.log(`Processing video... (attempt ${attempt})`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  async analyzeVideo(videoBuffer: Buffer, mimeType: string, prompt: string, model: string = 'gemini-2.0-flash') {
    const arrayBuffer = bufferToArrayBuffer(videoBuffer);
    const blob = new Blob([arrayBuffer], { type: mimeType });

    const uploaded = await this.ai.files.upload({
      file: blob,
      config: { mimeType },
    });

    console.log('Video uploaded:', uploaded.name);

    if (!uploaded.name) {
      throw new Error("File upload did not return a 'name' property");
    }

    const activeFile = await this.waitForFileActive(uploaded.name);

    console.log('Video processed and active!');

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

    return result.text;
  }
}
