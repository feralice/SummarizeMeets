import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Filter } from './types';

export function withFilters(filters: Filter[], handler: RequestHandler): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const f of filters) {
        await Promise.resolve(f(req));
      }
      return handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}
