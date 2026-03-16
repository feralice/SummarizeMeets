import { Router } from 'express';
import { upload } from 'src/config/multer';
import { GeminiProvider } from 'src/infrastructure/providers/gemini/gemini-provider';
import { withFilters } from './filters/with-filters';
import { PrismaMeetingRepository } from 'src/infrastructure/repositories/PrismaMeetingRepository';
import { PrismaUserRepository } from 'src/infrastructure/repositories/PrismaUserRepository';
import { validateMediaMimeType } from './filters/validate-media-type';
import { authMiddleware } from './middleware/auth.middleware';
import { AnalyzeVideoUseCase } from 'src/use-cases/analyze-video/analyze-video';

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
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!file) {
        return res.status(400).json({ error: 'Video file is required' });
      }

      const provider = new GeminiProvider(process.env.GEMINI_API_KEY!);
      const meetingRepository = new PrismaMeetingRepository();
      const userRepository = new PrismaUserRepository();
      const usecase = new AnalyzeVideoUseCase(provider, meetingRepository, userRepository);

      const result = await usecase.execute(file!.buffer, file!.mimetype, prompt, userId, title);

      return res.status(200).json({
        data: result,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  })
);

export default mediaRouter;
