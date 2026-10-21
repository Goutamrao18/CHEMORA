import express from 'express';
import cookieParser from 'cookie-parser';
import accountRouter from '../server/routes/account.ts';
import reviewsRouter from '../server/routes/reviews.ts';
import {
  apiRateLimiter,
  authRateLimiter,
  databaseRateLimiter
} from '../server/middleware/rateLimit.ts';

const app = express();

app.set('trust proxy', 1);
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

// API routes
app.use('/api/account', accountRouter);
app.use('/api/reviews', reviewsRouter);

// PubChem Compound proxy route with timeout & cache (M10 fix)
app.get('/api/science/compound', async (req, res) => {
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
  } catch (err) {
    return res.status(502).json({ error: 'PubChem query failed or timed out' });
  }
});

// 404 handler for unmapped API endpoints
app.use((_req, res) => {
  return res.status(404).json({ error: 'API endpoint not found' });
});

// Centralized error handling middleware
app.use((err, _req, res, _next) => {
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

export default app;
