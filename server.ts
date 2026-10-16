import express from 'express';
import type { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import accountRouter from './server/routes/account.ts';
import reviewsRouter from './server/routes/reviews.ts';

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
  app.use('/api/reviews', reviewsRouter);

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

  // Science intelligence proxy route for PubChem PUG REST
  app.get('/api/science/compound', async (req: Request, res: Response) => {
    try {
      const name = req.query.name as string;
      if (!name) return res.status(400).json({ error: 'Compound name query parameter is required' });
      const cidRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`);
      if (!cidRes.ok) return res.status(404).json({ error: 'Compound not found in PubChem' });
      const cidData = (await cidRes.json()) as any;
      const cid = cidData?.IdentifierList?.CID?.[0];
      if (!cid) return res.status(404).json({ error: 'No CID resolved' });

      const propsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,InChIKey,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount/JSON`;
      const propsRes = await fetch(propsUrl);
      if (!propsRes.ok) return res.status(500).json({ error: 'Failed to fetch properties' });
      const propsData = (await propsRes.json()) as any;
      return res.json({ cid, properties: propsData?.PropertyTable?.Properties?.[0] });
    } catch (err: any) {
      console.error('Science proxy error:', err);
      return res.status(500).json({ error: 'PubChem proxy error' });
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
    const fs = await import('node:fs/promises');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });

    // Explicit route for dedicated standalone 3D lab simulation with Vite HMR/Preamble transformation
    app.get(['/play', '/play/', '/play.html'], async (_req: Request, res: Response, next) => {
      try {
        const filePath = path.resolve(__dirname, 'play.html');
        const raw = await fs.readFile(filePath, 'utf-8');
        const transformed = await vite.transformIndexHtml('/play.html', raw);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed);
      } catch (e) {
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    // Explicit route for dedicated standalone 3D lab simulation in production
    app.get(['/play', '/play/', '/play.html'], (_req: Request, res: Response) => {
      const filePath = path.resolve(__dirname, 'dist', 'play.html');
      res.sendFile(filePath);
    });

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
