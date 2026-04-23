import { Response } from 'express';
import { constants as HttpStatus } from 'node:http2';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../domain/errors';
import logger from '../../../infrastructure/logger';

export function handleHttpError(err: unknown, res: Response): Response {
  if (err instanceof NotFoundError) {
    return res.status(HttpStatus.HTTP_STATUS_NOT_FOUND).json({ error: err.message });
  }
  if (err instanceof ForbiddenError) {
    return res.status(HttpStatus.HTTP_STATUS_FORBIDDEN).json({ error: err.message });
  }
  if (err instanceof ConflictError) {
    return res.status(HttpStatus.HTTP_STATUS_CONFLICT).json({ error: err.message });
  }
  if (err instanceof BadRequestError) {
    return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({ error: err.message });
  }
  if (err instanceof UnauthorizedError) {
    return res.status(HttpStatus.HTTP_STATUS_UNAUTHORIZED).json({ error: err.message });
  }
  logger.error({ err }, 'Unexpected error');
  return res
    .status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR)
    .json({ error: 'Internal server error' });
}
