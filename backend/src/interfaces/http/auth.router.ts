import { Router } from 'express';
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import { LoginUserUseCase } from '../../use-cases/auth/login-user';
import { RegisterUserUseCase } from '../../use-cases/auth/register-user';

const authRouter = Router();
const userRepository = new PrismaUserRepository();

authRouter.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const useCase = new RegisterUserUseCase(userRepository);
    const result = await useCase.execute({ name, email, password });
    return res.status(201).json(result);
  } catch (err: any) {
    if (err.message === 'Email already in use') {
      return res.status(409).json({ error: err.message });
    }
    if (err.message === 'Name, email and password are required') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const useCase = new LoginUserUseCase(userRepository);
    const result = await useCase.execute({ email, password });
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({ error: err.message });
    }
    if (err.message === 'Email and password are required') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default authRouter;
