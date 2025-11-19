import { Request } from 'express';

export type Filter = (req: Request) => void | Promise<void>;
