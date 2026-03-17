import { Router } from 'express';
import { upload } from 'src/config/multer';
import { GeminiProvider } from 'src/infrastructure/providers/gemini/gemini-provider';
import { withFilters } from './filters/with-filters';
import { PrismaMeetingRepository } from 'src/infrastructure/repositories/PrismaMeetingRepository';
import { validateMediaMimeType } from './filters/validate-media-type';
import { authMiddleware } from './middleware/auth.middleware';
import { AnalyzeVideoUseCase } from 'src/use-cases/analyze-video/analyze-video';
import { constants as HttpStatus } from 'node:http2';
import logger from 'src/infrastructure/logger';

const mediaRouter = Router();

mediaRouter.post(
  '/analyze-media',
  authMiddleware,
  upload.single('media'),
  withFilters([validateMediaMimeType], async (req, res) => {
    try {
      const file = req.file;
      const { prompt, title } = req.body;
      const userId = req.userId!;

      if (!prompt) {
        return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({ error: 'Prompt is required' });
      }

      if (!file) {
        return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({ error: 'Video file is required' });
      }

      const provider = new GeminiProvider(process.env.GEMINI_API_KEY!);
      const meetingRepository = new PrismaMeetingRepository();
      const usecase = new AnalyzeVideoUseCase(provider, meetingRepository);

      const result = await usecase.execute(file!.buffer, file!.mimetype, prompt, userId, title);

      return res.status(HttpStatus.HTTP_STATUS_OK).json({
        data: result,
      });
    } catch (err: any) {
      logger.error({ err, userId: req.userId }, 'Media analysis failed');
      return res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  })
);

export default mediaRouter;
