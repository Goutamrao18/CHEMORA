import express from 'express';
import type { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import http from 'node:http';
import path from 'node:path';
import fsSync from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import accountRouter from './server/routes/account.ts';
import reviewsRouter from './server/routes/reviews.ts';
import {
  apiRateLimiter,
  aiRateLimiter,
  databaseRateLimiter,
  authRateLimiter,
} from './server/middleware/rateLimit.ts';

// Load environment variables from .env if present
dotenv.config();

// Defensive Environment Validation (OWASP A05)
function validateEnvironment(): void {
  const warnings: string[] = [];
  if (process.env.SUPABASE_URL) {
    try {
      const u = new URL(process.env.SUPABASE_URL);
      if (u.protocol !== "https:" && u.protocol !== "http:") {
        warnings.push("SUPABASE_URL must use http/https protocol");
      }
    } catch {
      warnings.push("SUPABASE_URL is not a valid URL");
    }
  }
  if (process.env.PORT) {
    const p = parseInt(process.env.PORT, 10);
    if (isNaN(p) || p <= 0 || p > 65535) {
      warnings.push("PORT must be an integer between 1 and 65535");
    }
  }
  if (warnings.length > 0) {
    console.warn("⚠️ Environment configuration warnings:");
    warnings.forEach((w) => console.warn(`   - ${w}`));
  }
}
validateEnvironment();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const portArgIndex = process.argv.findIndex((arg) => arg === '--port' || arg === '-p');
  const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? parseInt(process.argv[portArgIndex + 1], 10) : NaN;
  const PORT = !isNaN(cliPort) && cliPort > 0 ? cliPort : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);
  const isProd = process.env.NODE_ENV === 'production';

  // Security Hardening: Disable Express fingerprinting header (OWASP A05)
  app.disable('x-powered-by');

  // Security Hardening: Baseline HTTP Security Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '0');
    if (isProd) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Enable trust proxy so client IP is accurately extracted behind reverse proxies / cloud environments
  app.set('trust proxy', 1);

  // H2: 100kb global json limit; assistant handles larger payloads separately
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(cookieParser());

  // 5.1: Never serve the repo root, .env, server/, data/ or dotfiles
  app.use((req, res, next) => {
    const rawPath = decodeURIComponent(req.path || '').toLowerCase();
    if (
      rawPath.includes('.env') ||
      rawPath.startsWith('/server') ||
      rawPath.startsWith('/data') ||
      rawPath.includes('/reviews.json') ||
      rawPath.includes('/package.json') ||
      rawPath.includes('/package-lock.json') ||
      rawPath.includes('/tsconfig')
    ) {
      return res.status(403).json({ error: 'Access forbidden.' });
    }
    next();
  });

  // High-performance video streaming with explicit Range support, 30-day cache, and immutable headers
  app.use('/videos', (req, res, next) => {
    if (req.url.includes('?import') || req.url.includes('?raw')) {
      return next();
    }
    express.static(path.resolve(__dirname, 'videos'), {
      maxAge: '30d',
      acceptRanges: true,
      cacheControl: true,
      immutable: true,
      dotfiles: 'deny',
      setHeaders: (res) => {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
      },
    })(req, res, next);
  });
  app.use('/know', express.static(path.resolve(__dirname, 'know'), { dotfiles: 'deny' }));
  app.use('/experiments', express.static(path.resolve(__dirname, 'experiments'), { dotfiles: 'deny' }));
  app.use('/assets', express.static(path.resolve(__dirname, 'assets'), { dotfiles: 'deny' }));
  app.use('/challenge/data', express.static(path.resolve(__dirname, 'challenge', 'data'), { dotfiles: 'deny' }));
  app.use(express.static(path.resolve(__dirname, 'public'), { dotfiles: 'deny' }));

  // Development-only loaders preview
  if (!isProd) {
    app.get('/loaders-preview.html', (_req, res) => {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.sendFile(path.resolve(__dirname, 'loaders-preview.html'));
    });
    app.get('/loaders-preview.css', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'loaders-preview.css'));
    });
    app.get('/loaders-preview.js', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'loaders-preview.js'));
    });
  }

  // --- Rate Limiting Protection Middleware ---
  // Baseline shield: Ensure no single IP can flood the /api routes
  app.use('/api', apiRateLimiter);

  // AI Endpoint Protection: Prevent expensive LLM vision / assistant prompt abuse
  app.use('/api/assistant', aiRateLimiter);

  // Authentication & Brute-Force Protection: Guard signup/login/password mutations
  app.use('/api/account/signup', authRateLimiter);
  app.use('/api/account/login', authRateLimiter);
  app.use('/api/account/forgot-password', authRateLimiter);
  app.use('/api/account/reset-password', authRateLimiter);
  app.use('/api/account/password', authRateLimiter);

  // Database Protection: Protect Supabase & file database from heavy write/read abuse
  app.use('/api/account', databaseRateLimiter);
  app.use('/api/reviews', databaseRateLimiter);

  // Mount backend API routes
  app.use('/api/account', accountRouter);
  app.use('/api/reviews', reviewsRouter);

  // Mount assistant route handler if available (with its own 12MB limit for homework images)
  const assistantJsonParser = express.json({ limit: '12mb' });
  app.all('/api/assistant', assistantJsonParser, async (req: Request, res: Response) => {
    try {
      // @ts-ignore Import JS handler without declaration file
      const assistantModule = await import('./api/assistant.js');
      const handler = assistantModule.default;
      return handler(req, res);
    } catch (err: any) {
      console.error('Error delegating to /api/assistant:', err);
      return res.status(500).json({ error: 'AI Assistant service unavailable' });
    }
  });

  // Science intelligence proxy route for PubChem PUG REST (M10 fix: validation, timeout, cache)
  app.get('/api/science/compound', async (req: Request, res: Response) => {
    try {
      const name = req.query.name as string;
      if (!name || typeof name !== 'string' || name.length > 120) {
        return res.status(400).json({ error: 'Compound name must be between 1 and 120 characters' });
      }
      const cidRes = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!cidRes.ok) return res.status(404).json({ error: 'Compound not found in PubChem' });
      const cidData = (await cidRes.json()) as any;
      const cid = cidData?.IdentifierList?.CID?.[0];
      if (!cid) return res.status(404).json({ error: 'No CID resolved' });

      const propsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,InChIKey,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount/JSON`;
      const propsRes = await fetch(propsUrl, { signal: AbortSignal.timeout(8000) });
      if (!propsRes.ok) return res.status(500).json({ error: 'Failed to fetch properties' });
      const propsData = (await propsRes.json()) as any;
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.json({ cid, properties: propsData?.PropertyTable?.Properties?.[0] });
    } catch (err: any) {
      console.error('Science proxy error:', err);
      return res.status(502).json({ error: 'PubChem proxy error or timeout' });
    }
  });

  // 404 handler for unmapped API endpoints (Express 5 compatible)
  app.use('/api', (_req: Request, res: Response) => {
    return res.status(404).json({ error: 'API endpoint not found' });
  });

  // Explicit route for account redirect (Audit Item 9 fix: redirect /account to React SPA #account)
  app.get(['/account', '/account.html'], (_req: Request, res: Response) => {
    res.redirect('/#account');
  });

  // Frontend routing
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: {
          server,
          clientPort: process.env.HMR_CLIENT_PORT ? parseInt(process.env.HMR_CLIENT_PORT, 10) : undefined,
        },
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, { dotfiles: 'deny' }));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Global Error Handling Middleware: Prevents unhandled body-parser or route crashes
  app.use((err: any, _req: Request, res: Response, _next: express.NextFunction) => {
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON payload.' });
    }
    if (err?.status === 413 || err?.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request payload exceeds size limit.' });
    }
    console.error('Server request error:', err?.message || err);
    if (res.headersSent) return;
    return res.status(err?.status || 500).json({ error: 'Internal server error occurred.' });
  });

  server.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE') {
      console.error(`🚨 Fatal: Port ${PORT} is already in use (EADDRINUSE). Exiting to permit clean port recovery.`);
      process.exit(1);
    }
    console.error('Fatal Server Socket Error:', err);
    process.exit(1);
  });

  const gracefulShutdown = () => {
    console.log('Stopping server cleanly...');
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1500).unref();
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🧪 CHEMORA Server online at http://0.0.0.0:${PORT} [mode: ${isProd ? 'production' : 'development'}]`);
    console.log(`📡 Backend account endpoints active at /api/account`);
    console.log(`🛡️ Rate limiting middleware active across /api routes (AI: 20/min, DB: 60/min, Auth: 25/15min, API: 120/min)\n`);
  });
}

// Global process guards: Prevent unexpected rejections or exceptions from terminating the Node process
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err: any) => {
  console.error('Uncaught Exception caught:', err);
  if (err?.code === 'EADDRINUSE') {
    process.exit(1);
  }
});

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
