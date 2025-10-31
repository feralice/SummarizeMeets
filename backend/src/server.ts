import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API is running successfully!' });
});

app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});
