import express, { Request, Response } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../src/interfaces/http/middleware/auth.middleware';

const JWT_SECRET = 'test-secret';

// Minimal app that applies the middleware and returns req.userId on success
const makeApp = () => {
  const app = express();
  app.get('/protected', authMiddleware, (req: Request, res: Response) => {
    res.json({ userId: req.userId });
  });
  return app;
};

const validToken = (userId = 'user-uuid') => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });

describe('authMiddleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should call next and inject userId for a valid token', async () => {
    const app = makeApp();
    const token = validToken('user-123');

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user-123');
  });

  it('should return 401 when Authorization header is missing', async () => {
    const res = await request(makeApp()).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing or invalid/i);
  });

  it('should return 401 when header does not start with "Bearer "', async () => {
    const res = await request(makeApp())
      .get('/protected')
      .set('Authorization', `Token ${validToken()}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing or invalid/i);
  });

  it('should return 401 for an invalid token', async () => {
    const res = await request(makeApp())
      .get('/protected')
      .set('Authorization', 'Bearer not-a-valid-jwt');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('should return 401 for a token signed with a different secret', async () => {
    const badToken = jwt.sign({ userId: 'user-1' }, 'wrong-secret');

    const res = await request(makeApp())
      .get('/protected')
      .set('Authorization', `Bearer ${badToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('should return 401 for an expired token', async () => {
    const expiredToken = jwt.sign({ userId: 'user-1' }, JWT_SECRET, { expiresIn: -1 });

    const res = await request(makeApp())
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('should return 500 when JWT_SECRET is not configured', async () => {
    delete process.env.JWT_SECRET;

    const res = await request(makeApp())
      .get('/protected')
      .set('Authorization', `Bearer ${validToken()}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/JWT_SECRET not configured/i);
  });
});
