import { Filter } from "./types";

export const validateVideoMimeType: Filter = (req) => {
  const file = req.file;

  if (!file) {
    const err: any = new Error('Video file is required');
    err.status = 400;
    throw err;
  }

  if (!file.mimetype.startsWith('video/')) {
    const err: any = new Error('Only video files are allowed');
    err.status = 415;
    throw err;
  }
};
