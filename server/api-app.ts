import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import accountRouter from './routes/account.ts';
import reviewsRouter from './routes/reviews.ts';
import adminRouter, { adminLoginRateLimiter } from './routes/admin.ts';
import {
  apiRateLimiter,
  authRateLimiter,
  databaseRateLimiter,
} from './middleware/rateLimit.ts';

const app = express();

app.set('trust proxy', 1);

// Normalize Vercel Serverless Function rewrites
// When Vercel rewrites /api/(.*) to /api, it passes the original requested path in x-matched-path or x-forwarded-uri
app.use((req: Request, _res: Response, next: NextFunction) => {
  const matched = (req.headers['x-matched-path'] || req.headers['x-forwarded-uri']) as string | undefined;
  if (matched && matched.startsWith('/api')) {
    if (
      req.url === '/' ||
      req.url === '/api' ||
      req.url === '/api/index' ||
      req.url.startsWith('/api/[...path]') ||
      req.url.startsWith('/[...path]')
    ) {
      req.url = matched;
    }
  }
  next();
});

app.disable('x-powered-by');

// Security Hardening: Baseline HTTP Security Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com https://cdn.jsdelivr.net https://mcwadkgzplurjtstrhdd.supabase.co; media-src 'self' https://mcwadkgzplurjtstrhdd.supabase.co; connect-src 'self' https://mcwadkgzplurjtstrhdd.supabase.co https://generativelanguage.googleapis.com https://openrouter.ai"
  );
  next();
});

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// Rate limiters
app.use('/api', apiRateLimiter);
app.use('/api/account/signup', authRateLimiter);
app.use('/api/account/login', authRateLimiter);
app.use('/api/account/forgot-password', authRateLimiter);
app.use('/api/account/reset-password', authRateLimiter);
app.use('/api/account/password', authRateLimiter);
app.use('/api/account', databaseRateLimiter);
app.use('/api/reviews', databaseRateLimiter);
app.use('/api/admin/login', adminLoginRateLimiter);
app.use('/api/admin/verify-2fa', adminLoginRateLimiter);

// API routes
app.use('/api/account', accountRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin', adminRouter);

// AI Assistant endpoint with 12MB limit for homework photos
const assistantJsonParser = express.json({ limit: '12mb' });
app.all('/api/assistant', assistantJsonParser, async (req: Request, res: Response) => {
  try {
    // @ts-ignore Import JS handler
    const assistantModule = await import('../api/assistant.js');
    const handler = assistantModule.default;
    return handler(req, res);
  } catch (err: any) {
    console.error('Error delegating to /api/assistant:', err);
    return res.status(500).json({ error: 'AI Assistant service unavailable' });
  }
});

// PubChem Compound proxy route with timeout & cache
app.get('/api/science/compound', async (req: Request, res: Response) => {
  try {
    const name = req.query.name;
    if (!name || typeof name !== 'string' || name.length > 120) {
      return res.status(400).json({ error: 'Compound name must be between 1 and 120 characters' });
    }

    const cidRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!cidRes.ok) return res.status(404).json({ error: 'Compound not found in PubChem' });
    const cidData = await cidRes.json();
    const cid = cidData?.IdentifierList?.CID?.[0];
    if (!cid) return res.status(404).json({ error: 'No CID resolved' });

    const propsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,InChIKey,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount/JSON`;
    const propsRes = await fetch(propsUrl, { signal: AbortSignal.timeout(8000) });
    if (!propsRes.ok) return res.status(500).json({ error: 'Failed to fetch properties' });
    const propsData = await propsRes.json();
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.json({ cid, properties: propsData?.PropertyTable?.Properties?.[0] });
  } catch {
    return res.status(502).json({ error: 'PubChem query failed or timed out' });
  }
});

// 404 handler for unmapped API endpoints
app.use((_req: Request, res: Response) => {
  return res.status(404).json({ error: 'API endpoint not found' });
});

// Centralized error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON payload.' });
  }
  if (err?.status === 413 || err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload exceeds size limit.' });
  }
  console.error('API Error:', err?.message || err);
  if (res.headersSent) return;
  return res.status(err?.status || 500).json({ error: 'Internal server error occurred.' });
});

export { app };
export default app;
