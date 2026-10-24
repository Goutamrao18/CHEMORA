import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import accountRouter from './routes/account.ts';
import reviewsRouter from './routes/reviews.ts';
import adminRouter, { adminLoginRateLimiter } from './routes/admin.ts';
import {
  apiRateLimiter,
  aiRateLimiter,
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
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com https://cdn.jsdelivr.net https://mcwadkgzplurjtstrhdd.supabase.co https://pubchem.ncbi.nlm.nih.gov https://lh3.googleusercontent.com; media-src 'self' blob: https://mcwadkgzplurjtstrhdd.supabase.co; connect-src 'self' https://mcwadkgzplurjtstrhdd.supabase.co https://generativelanguage.googleapis.com https://openrouter.ai https://pubchem.ncbi.nlm.nih.gov https://files.rcsb.org https://data.rcsb.org https://alphafold.ebi.ac.uk; object-src 'none'; base-uri 'self'; form-action 'self';"
  );
  next();
});

// Security Hardening: Block sensitive directories, source code, internal configs, dotfiles, and path traversal
app.use((req: Request, res: Response, next: NextFunction) => {
  let rawPath = '';
  try {
    rawPath = decodeURIComponent(req.path || '').toLowerCase();
  } catch {
    return res.status(400).json({ error: 'Bad Request: Malformed URI sequence' });
  }

  // 1. Block directory traversal attempts
  if (rawPath.includes('..') || rawPath.includes('\\') || req.url.includes('%2e%2e') || req.url.includes('%252e')) {
    return res.status(403).json({ error: 'Access forbidden: Path traversal detected.' });
  }

  // 2. Block dotfiles and hidden folders (e.g. /.git, /.aistudio, /.env, /.vscode, etc.)
  if (rawPath.startsWith('/.') || rawPath.includes('/.')) {
    return res.status(403).json({ error: 'Access forbidden.' });
  }

  // 3. Block sensitive internal server, script, database, and admin directories
  if (
    rawPath.startsWith('/server') ||
    rawPath.startsWith('/scripts') ||
    rawPath.startsWith('/supabase') ||
    rawPath.startsWith('/data') ||
    rawPath.startsWith('/node_modules') ||
    rawPath.startsWith('/.aistudio')
  ) {
    return res.status(403).json({ error: 'Access forbidden: Internal resource.' });
  }

  // 4. Block build configs, package manifests, lockfiles, and server source files
  if (
    rawPath.includes('.env') ||
    rawPath.includes('/reviews.json') ||
    rawPath.includes('/package.json') ||
    rawPath.includes('/package-lock.json') ||
    rawPath.includes('/bun.lock') ||
    rawPath.includes('/tsconfig') ||
    rawPath.includes('/metadata.json') ||
    rawPath.includes('/makefile') ||
    rawPath.includes('/vite.config') ||
    rawPath.includes('/postcss.config') ||
    rawPath.includes('/tailwind.config') ||
    rawPath.endsWith('.ts') ||
    rawPath.endsWith('.tsx') ||
    rawPath.endsWith('.mjs') ||
    rawPath.endsWith('.sh') ||
    rawPath.endsWith('.sql') ||
    rawPath.endsWith('.bak')
  ) {
    return res.status(403).json({ error: 'Access forbidden: Protected file type.' });
  }

  next();
});

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// Rate limiters
app.use('/api', apiRateLimiter);
app.use('/api/assistant', aiRateLimiter);
app.use('/api/account/signup', authRateLimiter);
app.use('/api/account/login', authRateLimiter);
app.use('/api/account/forgot-password', authRateLimiter);
app.use('/api/account/reset-password', authRateLimiter);
app.use('/api/account/password', authRateLimiter);
app.use('/api/account', databaseRateLimiter);
app.use('/api/reviews', databaseRateLimiter);
app.use('/api/admin/login', adminLoginRateLimiter);
app.use('/api/admin/otp/verify', adminLoginRateLimiter);
app.use('/api/admin/otp/resend', adminLoginRateLimiter);

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
    const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
    if (!name || name.length > 120 || /[\r\n\t\0]/.test(name) || !/^[a-zA-Z0-9\s\-–—,()[\]'+*]+$/.test(name)) {
      return res.status(400).json({ error: 'Compound name contains invalid characters or exceeds 120 characters' });
    }

    const cidRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!cidRes.ok) return res.status(404).json({ error: 'Compound not found in PubChem' });
    const cidData = await cidRes.json();
    const cid = cidData?.IdentifierList?.CID?.[0];
    if (typeof cid !== 'number' || cid <= 0 || !Number.isInteger(cid)) {
      return res.status(404).json({ error: 'No valid numeric CID resolved' });
    }

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

// PubChem Periodic Table & Element Data Cache
let cachedPeriodicTable: any = null;
let cachedPeriodicTableTime = 0;
const elementDetailCache = new Map<string, { data: any; timestamp: number }>();

app.get('/api/science/element', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || req.query.symbol as string || req.query.number as string || '').trim();
    const now = Date.now();

    // Check cache first
    if (query && elementDetailCache.has(query.toLowerCase())) {
      const cached = elementDetailCache.get(query.toLowerCase())!;
      if (now - cached.timestamp < 86400000) {
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        return res.json(cached.data);
      }
    }

    // Fetch or use cached full periodic table from PubChem
    if (!cachedPeriodicTable || now - cachedPeriodicTableTime > 86400000) {
      try {
        const ptRes = await fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON', {
          signal: AbortSignal.timeout(10000),
        });
        if (ptRes.ok) {
          cachedPeriodicTable = await ptRes.json();
          cachedPeriodicTableTime = now;
        }
      } catch (fetchErr) {
        console.warn('PubChem periodic table fetch fallback:', fetchErr);
      }
    }

    // If no query requested, return the full table
    if (!query) {
      if (cachedPeriodicTable) {
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        return res.json(cachedPeriodicTable);
      }
      return res.status(503).json({ error: 'PubChem periodic table temporarily unavailable' });
    }

    // Find the element in the periodic table
    const columns: string[] = cachedPeriodicTable?.Table?.Columns?.Column || [];
    const rows: any[] = cachedPeriodicTable?.Table?.Row || [];
    const queryLower = query.toLowerCase();

    const numIdx = columns.indexOf('AtomicNumber');
    const symIdx = columns.indexOf('Symbol');
    const nameIdx = columns.indexOf('Name');

    const matchedRow: any = rows.find((r: any) => {
      const num = String(r?.Cell?.[numIdx] || '');
      const sym = String(r?.Cell?.[symIdx] || '').toLowerCase();
      const name = String(r?.Cell?.[nameIdx] || '').toLowerCase();
      return num === queryLower || sym === queryLower || name === queryLower;
    });

    const elementData: Record<string, any> = {};
    if (matchedRow) {
      columns.forEach((col, idx) => {
        elementData[col] = matchedRow?.Cell?.[idx];
      });
    }

    // Fetch PubChem CID & compound properties if element name is known
    const elementName = elementData.Name || query;
    let pubchemCompound = null;
    try {
      const cidRes = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(elementName)}/cids/JSON`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (cidRes.ok) {
        const cidData = (await cidRes.json()) as any;
        const cid = cidData?.IdentifierList?.CID?.[0];
        if (cid) {
          const propRes = await fetch(
            `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,InChIKey,Complexity/JSON`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (propRes.ok) {
            const propData = (await propRes.json()) as any;
            pubchemCompound = {
              cid,
              properties: propData?.PropertyTable?.Properties?.[0],
              structure2DUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?image_size=300x300`,
              pubchemUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
            };
          }
        }
      }
    } catch (cidErr) {
      console.warn(`PubChem compound lookup skipped for ${elementName}:`, cidErr);
    }

    const result = {
      element: elementData,
      pubchemCompound,
      source: 'PubChem PUG REST API',
    };

    elementDetailCache.set(queryLower, { data: result, timestamp: now });
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.json(result);
  } catch (err: any) {
    console.error('PubChem element proxy error:', err);
    return res.status(502).json({ error: 'PubChem proxy error or timeout' });
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
