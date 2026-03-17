import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mediaRouter from './interfaces/http/media-upload.router';
import userRouter from './interfaces/http/user.router';
import meetingRouter from './interfaces/http/meeting.router';
import meetingsRouter from './interfaces/http/meetings.router';
import authRouter from './interfaces/http/auth.router';
import logger from './infrastructure/logger';

dotenv.config();
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api', authRouter);
app.use('/api', mediaRouter);
app.use('/api', userRouter);
app.use('/api', meetingsRouter);
app.use('/api/meetings', meetingRouter);

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Server started');
});
