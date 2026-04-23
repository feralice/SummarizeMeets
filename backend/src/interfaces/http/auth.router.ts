import { Router } from 'express';
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import { LoginUserUseCase } from '../../use-cases/auth/login-user';
import { RegisterUserUseCase } from '../../use-cases/auth/register-user';
import { ChangePasswordUseCase } from '../../use-cases/users/change-password';
import { UpdateProfileUseCase } from '../../use-cases/users/update-profile';
import { constants as HttpStatus } from 'node:http2';
import logger from '../../infrastructure/logger';
import { authMiddleware } from './middleware/auth.middleware';
import { z } from 'zod';

const authRouter = Router();
const userRepository = new PrismaUserRepository();

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Password confirmation does not match',
    path: ['confirmPassword'],
  });

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

authRouter.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await userRepository.findById(req.userId!);

    if (!user) {
      return res.status(HttpStatus.HTTP_STATUS_NOT_FOUND).json({ error: 'User not found' });
    }

    return res.status(HttpStatus.HTTP_STATUS_OK).json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err: any) {
    logger.error({ err, userId: req.userId }, 'Profile fetch error');
    return res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
});

authRouter.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({
        error: 'Invalid profile payload',
        details: parsed.error.issues,
      });
    }

    const useCase = new UpdateProfileUseCase(userRepository);
    const user = await useCase.execute(req.userId!, parsed.data);

    return res.status(HttpStatus.HTTP_STATUS_OK).json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err: any) {
    if (err.message === 'User not found') {
      return res.status(HttpStatus.HTTP_STATUS_NOT_FOUND).json({ error: err.message });
    }
    if (err.message === 'Name must be between 2 and 120 characters') {
      return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({ error: err.message });
    }
    logger.error({ err, userId: req.userId }, 'Profile update error');
    return res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
});

authRouter.patch('/profile/password', authMiddleware, async (req, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({
        error: 'Invalid password payload',
        details: parsed.error.issues,
      });
    }

    const useCase = new ChangePasswordUseCase(userRepository);
    await useCase.execute(req.userId!, {
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });

    return res.status(HttpStatus.HTTP_STATUS_NO_CONTENT).send();
  } catch (err: any) {
    if (err.message === 'User not found') {
      return res.status(HttpStatus.HTTP_STATUS_NOT_FOUND).json({ error: err.message });
    }
    if (
      err.message === 'Current password is incorrect' ||
      err.message === 'New password must have at least 8 characters' ||
      err.message === 'New password must be different from current password' ||
      err.message === 'Current password and new password are required'
    ) {
      return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({ error: err.message });
    }
    logger.error({ err, userId: req.userId }, 'Password change error');
    return res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
});

export default authRouter;
