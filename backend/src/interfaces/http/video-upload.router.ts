import { Router } from 'express';
import { upload } from 'src/config/multer';
import { GeminiProvider } from 'src/infrastructure/providers/gemini/gemini-provider';
import { AnalyzeVideoUseCase } from 'src/use-cases/analyze-video/analyze-video';
import { withFilters } from './filters/with-filters';
import { validateVideoMimeType } from './filters/validade-video-type';

const videoRouter = Router();

videoRouter.post(
  '/analyze-video',
  upload.single('video'),
  withFilters([validateVideoMimeType], async (req, res) => {
    try {
      const file = req.file;
      const prompt = req.body.prompt;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!file) {
        return res.status(400).json({ error: 'Video file is required' });
      }

      const provider = new GeminiProvider(process.env.GEMINI_API_KEY!);
      const usecase = new AnalyzeVideoUseCase(provider);

      const result = await usecase.execute(file!.buffer, file!.mimetype, prompt);

      return res.status(200).json({
        data: result,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  })
);

export default videoRouter;
