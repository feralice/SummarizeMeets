import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import dotenv from 'dotenv';
import logger from '../logger';

const AWS_TIMEOUT_MS = 10000;

/**
 * Loads config: tries AWS SSM + Secrets Manager first, falls back to .env.
 * Must be called before any module that reads process.env (especially prisma.ts).
 *
 * - On EC2 (has IAM role): always loads from AWS. Throws on misconfiguration.
 * - Locally (no credentials): falls back to .env silently.
 */
export async function loadConfig(): Promise<void> {
  const loaded = await tryLoadFromAWS();

  if (!loaded) {
    dotenv.config();
    logger.info('Config loaded from .env');
  }

  validateConfig();
}

async function tryLoadFromAWS(): Promise<boolean> {
  const region = process.env.AWS_REGION || 'us-east-1';

  try {
    const [ssmParams, appSecrets, rdsCredentials] = await Promise.all([
      fetchSSMParameters(region, ['/summeet/s3/recordings-bucket']),
      fetchSecret(region, 'summeet-app-secrets'),
      fetchSecret(region, 'summeet-rds-credentials'),
    ]);

    const { username, password, host, port, dbname } = rdsCredentials;

    process.env.DATABASE_URL = `postgresql://${username}:${encodeURIComponent(password)}@${host}:${port}/${dbname}?sslmode=no-verify`;
    process.env.S3_RECORDINGS_BUCKET = ssmParams['/summeet/s3/recordings-bucket'];
    process.env.GEMINI_API_KEY = appSecrets['GEMINI_API_KEY'];
    process.env.JWT_SECRET = appSecrets['JWT_SECRET'];
    process.env.AWS_REGION = region;

    logger.info('Config loaded from AWS');
    return true;
  } catch (err: any) {
    logger.info({ reason: err?.message }, 'AWS config unavailable, falling back to .env');
    return false;
  }
}

async function fetchSSMParameters(region: string, names: string[]): Promise<Record<string, string>> {
  const client = new SSMClient({ region, requestHandler: new NodeHttpHandler({ requestTimeout: AWS_TIMEOUT_MS }) });
  const result = await client.send(new GetParametersCommand({ Names: names, WithDecryption: false }));

  const params: Record<string, string> = {};
  for (const param of result.Parameters ?? []) {
    if (param.Name && param.Value) params[param.Name] = param.Value;
  }

  const missing = names.filter((n) => !params[n]);
  if (missing.length > 0) throw new Error(`SSM parameters not found: ${missing.join(', ')}`);

  return params;
}

async function fetchSecret(region: string, secretId: string): Promise<Record<string, string>> {
  const client = new SecretsManagerClient({ region, requestHandler: new NodeHttpHandler({ requestTimeout: AWS_TIMEOUT_MS }) });
  const result = await client.send(new GetSecretValueCommand({ SecretId: secretId }));

  if (!result.SecretString) throw new Error(`Secret "${secretId}" has no string value`);

  return JSON.parse(result.SecretString);
}

function validateConfig(): void {
  const required = ['DATABASE_URL', 'GEMINI_API_KEY', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars: ${missing.join(', ')}\nCreate a .env file based on .env.example`
    );
  }
}
