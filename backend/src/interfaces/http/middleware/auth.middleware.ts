import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { constants as HttpStatus } from 'node:http2';
import logger from 'src/infrastructure/logger';

interface JwtPayload {
  userId: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn({ path: req.path, method: req.method }, 'Request rejected: missing or invalid authorization header');
    res.status(HttpStatus.HTTP_STATUS_UNAUTHORIZED).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.error('JWT_SECRET is not configured');
    res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'JWT_SECRET not configured' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.userId = payload.userId;
    logger.info({ userId: payload.userId, path: req.path, method: req.method }, 'Request authenticated');
    next();
  } catch {
    logger.warn({ path: req.path, method: req.method }, 'Request rejected: invalid or expired token');
    res.status(HttpStatus.HTTP_STATUS_UNAUTHORIZED).json({ error: 'Invalid or expired token' });
  }
}
