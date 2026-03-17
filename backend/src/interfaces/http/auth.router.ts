import { Router } from 'express';
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import { LoginUserUseCase } from '../../use-cases/auth/login-user';
import { RegisterUserUseCase } from '../../use-cases/auth/register-user';
import { constants as HttpStatus } from 'node:http2';
import logger from '../../infrastructure/logger';

const authRouter = Router();
const userRepository = new PrismaUserRepository();

authRouter.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    logger.info({ email }, 'Register attempt');
    const useCase = new RegisterUserUseCase(userRepository);
    const result = await useCase.execute({ name, email, password });
    logger.info({ userId: result.user.id, email }, 'User registered successfully');
    return res.status(HttpStatus.HTTP_STATUS_CREATED).json(result);
  } catch (err: any) {
    if (err.message === 'Email already in use') {
      logger.warn({ email: req.body.email }, 'Register failed: email already in use');
      return res.status(HttpStatus.HTTP_STATUS_CONFLICT).json({ error: err.message });
    }
    if (err.message === 'Name, email and password are required') {
      return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({ error: err.message });
    }
    logger.error({ err }, 'Register error');
    return res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
});

authRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.info({ email }, 'Login attempt');
    const useCase = new LoginUserUseCase(userRepository);
    const result = await useCase.execute({ email, password });
    logger.info({ userId: result.user.id, email }, 'Login successful');
    return res.status(HttpStatus.HTTP_STATUS_OK).json(result);
  } catch (err: any) {
    if (err.message === 'Invalid credentials') {
      logger.warn({ email: req.body.email }, 'Login failed: invalid credentials');
      return res.status(HttpStatus.HTTP_STATUS_UNAUTHORIZED).json({ error: err.message });
    }
    if (err.message === 'Email and password are required') {
      return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({ error: err.message });
    }
    logger.error({ err }, 'Login error');
    return res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
});

export default authRouter;
