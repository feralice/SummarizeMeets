import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mediaRouter from './interfaces/http/media-upload.router';
import userRouter from './interfaces/http/user.router';

dotenv.config();
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api', mediaRouter);
app.use('/api', userRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
