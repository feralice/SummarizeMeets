import express from 'express';
import { Router } from 'express';

/**
 * Creates a minimal Express app with JSON parsing.
 * Pass the router under test to isolate it from the full server setup.
 */
export function makeApp(router: Router) {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}
