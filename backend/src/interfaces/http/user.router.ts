import { Router } from 'express';
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import { CreateUserUseCase } from '../../use-cases/users/create-user';
import { ListUsersUseCase } from '../../use-cases/users/list-users';
import { FindUserUseCase } from '../../use-cases/users/find-user';
import { UpdateUserUseCase } from '../../use-cases/users/update-user';
import { DeleteUserUseCase } from '../../use-cases/users/delete-user';

const userRouter = Router();
const userRepository = new PrismaUserRepository();

userRouter.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const useCase = new CreateUserUseCase(userRepository);
    const user = await useCase.execute({ name, email, password });

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
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

userRouter.get('/users', async (_req, res) => {
  try {
    const useCase = new ListUsersUseCase(userRepository);
    const users = await useCase.execute();

    const result = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    }));

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

userRouter.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const useCase = new FindUserUseCase(userRepository);
    const user = await useCase.execute(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

userRouter.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const useCase = new UpdateUserUseCase(userRepository);
    const user = await useCase.execute(id, { name, email, password });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      updatedAt: user.updatedAt,
    });
  } catch (err: any) {
    if (err.message === 'User not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === 'Email already in use') {
      return res.status(409).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

userRouter.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const useCase = new DeleteUserUseCase(userRepository);
    await useCase.execute(id);

    return res.status(204).send();
  } catch (err: any) {
    if (err.message === 'User not found') {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default userRouter;
