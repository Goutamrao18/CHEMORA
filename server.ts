import express from 'express';
import type { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import accountRouter from './server/routes/account.ts';

// Load environment variables from .env if present
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(cookieParser());

  // Mount backend API routes
  app.use('/api/account', accountRouter);

  // Mount assistant route handler if available
  app.all('/api/assistant', async (req: Request, res: Response) => {
    try {
      // @ts-expect-error Import JS handler without declaration file
      const assistantModule = await import('./api/assistant.js');
      const handler = assistantModule.default;
      return handler(req, res);
    } catch (err: any) {
      console.error('Error delegating to /api/assistant:', err);
      return res.status(500).json({ error: 'AI Assistant service unavailable' });
    }
  });

  // Explicit route for standalone account.html
  app.get('/account.html', (_req: Request, res: Response) => {
    const filePath = isProd
      ? path.resolve(__dirname, 'dist', 'account.html')
      : path.resolve(__dirname, 'account.html');
    res.sendFile(filePath);
  });

  // Frontend routing
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🧪 CHEMORA Server online at http://0.0.0.0:${PORT} [mode: ${isProd ? 'production' : 'development'}]`);
    console.log(`📡 Backend account endpoints active at /api/account\n`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
