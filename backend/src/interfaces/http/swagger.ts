import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// ─── Reusable components ─────────────────────────────────────────────────────

const ErrorSchema = registry.register(
  'Error',
  z.object({ error: z.string() }).openapi('Error'),
);

const ActionItemSchema = registry.register(
  'ActionItem',
  z
    .object({
      task: z.string(),
      responsible: z.string().nullable(),
      deadline: z.string().nullable().openapi({ example: '2026-04-20' }),
      needs_review: z.boolean(),
    })
    .openapi('ActionItem'),
);

const SpeakerSchema = registry.register(
  'Speaker',
  z
    .object({
      speaker: z.string(),
      description: z.string(),
    })
    .openapi('Speaker'),
);

const TopicSchema = registry.register(
  'Topic',
  z
    .object({
      title: z.string(),
      description: z.string(),
    })
    .openapi('Topic'),
);

const SummarySchema = registry.register(
  'Summary',
  z
    .object({
      introduction: z.string(),
      key_points: z.array(z.string()),
      conclusion: z.string(),
    })
    .openapi('Summary'),
);

const MeetingSchema = registry.register(
  'Meeting',
  z
    .object({
      id: z.string().uuid(),
      meetingTitle: z.string(),
      meetingDate: z.string().datetime(),
      status: z.enum(['pending', 'queued', 'processing', 'completed', 'failed']),
      summary: SummarySchema,
      topics: z.array(TopicSchema),
      decisions: z.array(z.string()),
      actionItems: z.array(ActionItemSchema),
      speakers: z.array(SpeakerSchema),
      s3Key: z.string().nullable().optional(),
      userId: z.string().uuid(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })
    .openapi('Meeting'),
);

// ─── Bearer security scheme ───────────────────────────────────────────────────

registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// ─── Auth routes ──────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: 'Register a new user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().openapi({ example: 'João Hipólito' }),
            email: z.string().email().openapi({ example: 'joao@example.com' }),
            password: z.string().min(6).openapi({ example: 'secret123' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User created',
      content: {
        'application/json': {
          schema: z.object({
            token: z.string(),
            user: z.object({ id: z.string().uuid(), name: z.string(), email: z.string() }),
          }),
        },
      },
    },
    400: { description: 'Missing required fields', content: { 'application/json': { schema: ErrorSchema } } },
    409: { description: 'Email already in use', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: 'Login and receive JWT token',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email().openapi({ example: 'joao@example.com' }),
            password: z.string().openapi({ example: 'secret123' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: z.object({
            token: z.string(),
            user: z.object({ id: z.string().uuid(), name: z.string(), email: z.string() }),
          }),
        },
      },
    },
    400: { description: 'Missing required fields', content: { 'application/json': { schema: ErrorSchema } } },
    401: { description: 'Invalid credentials', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

// ─── Upload / Analyze routes ──────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/api/upload-url',
  tags: ['Media'],
  summary: 'Generate pre-signed S3 PUT URL for direct browser upload',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            mimeType: z
              .string()
              .openapi({ example: 'video/mp4', description: 'MIME type of the file to upload' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Pre-signed URL and S3 key',
      content: {
        'application/json': {
          schema: z.object({
            uploadUrl: z.string().url().openapi({ description: 'PUT this URL with the file body directly — expires in 15 min' }),
            s3Key: z.string().openapi({ example: 'recordings/user-id/uuid.mp4' }),
          }),
        },
      },
    },
    400: { description: 'mimeType missing', content: { 'application/json': { schema: ErrorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorSchema } } },
    422: { description: 'Unsupported media type', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/analyze-media',
  tags: ['Media'],
  summary: 'Enqueue a meeting for AI analysis (file must already be in S3)',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            s3Key: z.string().openapi({ example: 'recordings/user-id/uuid.mp4' }),
            meetingTitle: z.string().optional().openapi({ example: 'Daily de Produto' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Meeting enqueued for processing',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              meetingId: z.string().uuid(),
              status: z.literal('queued'),
            }),
          }),
        },
      },
    },
    400: { description: 's3Key missing', content: { 'application/json': { schema: ErrorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorSchema } } },
    503: { description: 'Queue full — retry later', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

// ─── Meetings routes ──────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/meetings/user/{userId}',
  tags: ['Meetings'],
  summary: 'List all meetings for a user',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ userId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'List of meetings',
      content: {
        'application/json': {
          schema: z.object({ data: z.array(MeetingSchema) }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Forbidden — userId does not match token', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/history',
  tags: ['Meetings'],
  summary: 'List meetings for the authenticated user (derived from JWT)',
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: 'List of meetings',
      content: {
        'application/json': {
          schema: z.object({ data: z.array(MeetingSchema) }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/meetings/{id}',
  tags: ['Meetings'],
  summary: 'Get meeting details',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Meeting details',
      content: { 'application/json': { schema: z.object({ data: MeetingSchema }) } },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: ErrorSchema } } },
    404: { description: 'Meeting not found', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/meetings/{id}/download-url',
  tags: ['Meetings'],
  summary: 'Generate pre-signed S3 GET URL to download the original recording',
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Pre-signed download URL (valid for 15 min)',
      content: {
        'application/json': {
          schema: z.object({ data: z.object({ downloadUrl: z.string().url() }) }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: ErrorSchema } } },
    404: { description: 'Meeting not found or no recording attached', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'SumMeet AI API',
      version: '1.0.0',
      description:
        'API para transformar gravações de reuniões em resumos estruturados usando Google Gemini.',
    },
    servers: [{ url: process.env.API_URL || 'http://localhost:3000' }],
  });
}
