import { Filter } from './types';

export const validateMediaMimeType: Filter = (req) => {
  const file = req.file;

  if (!file) {
    const err: any = new Error('Media file is required');
    err.status = 400;
    throw err;
  }

  const isVideo = file.mimetype.startsWith('video/');
  const isAudio = file.mimetype.startsWith('audio/');

  if (!isVideo && !isAudio) {
    const err: any = new Error('Only video and audio files are allowed');
    err.status = 415;
    throw err;
  }
};
