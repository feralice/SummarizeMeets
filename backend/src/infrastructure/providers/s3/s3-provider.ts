import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import logger from '../../logger';

export class S3Provider {
  // Initialized lazily on first use — allows app-config.ts to load env vars before S3 is needed.
  private _client: S3Client | undefined;
  private _bucket: string | undefined;

  private get client(): S3Client {
    if (!this._client) {
      this._client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    }
    return this._client;
  }

  private get bucket(): string {
    if (!this._bucket) {
      this._bucket = process.env.S3_RECORDINGS_BUCKET;
      if (!this._bucket) throw new Error('S3_RECORDINGS_BUCKET env var is required');
    }
    return this._bucket;
  }

  /**
   * Generates a pre-signed PUT URL for direct browser-to-S3 upload.
   * Returns the s3Key to be stored in the Meeting record.
   */
  async getUploadUrl(mimeType: string, userId: string): Promise<{ uploadUrl: string; s3Key: string }> {
    const ext = mimeType.split('/')[1] ?? 'bin';
    const s3Key = `recordings/${userId}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 15 * 60 });
    logger.debug({ s3Key, userId }, 'Generated pre-signed PUT URL');

    return { uploadUrl, s3Key };
  }

  /**
   * Generates a pre-signed GET URL for temporary download access.
   */
  async getDownloadUrl(s3Key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn: 15 * 60 });
    logger.debug({ s3Key }, 'Generated pre-signed GET URL');

    return url;
  }

  /**
   * Downloads the file from S3 into a Buffer so the queue worker can send it to Gemini.
   */
  async downloadFile(s3Key: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`S3 object not found or empty: ${s3Key}`);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const mimeType = response.ContentType ?? 'application/octet-stream';

    logger.info({ s3Key, bytes: buffer.byteLength }, 'Downloaded file from S3');

    return { buffer, mimeType };
  }
}
