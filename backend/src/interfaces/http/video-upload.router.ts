import { Router } from 'express';
import { upload } from 'src/config/multer';
import { GeminiProvider } from 'src/infrastructure/providers/gemini/gemini-provider';
import { AnalyzeVideoUseCase } from 'src/use-cases/analyze-video/analyze-video';

const videoRouter = Router();

videoRouter.post('/analyze-video', upload.single('video'), async (req, res) => {
  try {
    const file = req.file;
    const prompt = req.body.prompt;

    if (!file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const provider = new GeminiProvider(process.env.GEMINI_API_KEY!);
    const usecase = new AnalyzeVideoUseCase(provider);

    const result = await usecase.execute(file.buffer, file.mimetype, prompt);

    return res.json({ result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default videoRouter;
