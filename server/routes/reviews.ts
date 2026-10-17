import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { getSupabaseBackendClient } from '../supabase.ts';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../data/reviews.json');

export interface ReviewRecord {
  id: string;
  authorName: string;
  role: string;
  avatarUrl?: string;
  rating: number; // 1 to 5
  category: string;
  title: string;
  content: string;
  wouldRecommend: boolean;
  helpful: number;
  verified: boolean;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalCount: number;
  recommendationRate: number; // percentage e.g. 98
  ratingCounts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  categoryCounts: Record<string, number>;
}

// In-memory cache synced with disk/supabase
let reviewsCache: ReviewRecord[] = [];
let isLoaded = false;

async function loadReviews(): Promise<ReviewRecord[]> {
  if (isLoaded && reviewsCache.length > 0) {
    return reviewsCache;
  }

  // 1. Try Supabase
  const supabase = getSupabaseBackendClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('chemora_reviews')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && data && data.length > 0) {
        reviewsCache = data as ReviewRecord[];
        isLoaded = true;
        return reviewsCache;
      }
    } catch {
      // Fall through to file DB
    }
  }

  // 2. Read from persistent file database
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      reviewsCache = parsed;
      isLoaded = true;
      return reviewsCache;
    }
  } catch (err) {
    console.warn('Could not read reviews.json, initializing empty or default array', err);
  }

  isLoaded = true;
  return reviewsCache;
}

async function saveReviews(records: ReviewRecord[]): Promise<void> {
  reviewsCache = records;

  // Persist to JSON file
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing reviews to disk:', err);
  }

  // Best effort sync to Supabase
  const supabase = getSupabaseBackendClient();
  if (supabase) {
    try {
      await supabase.from('chemora_reviews').upsert(records, { onConflict: 'id' });
    } catch {
      // Non-blocking
    }
  }
}

function calculateSummary(records: ReviewRecord[]): ReviewSummary {
  const totalCount = records.length;
  if (totalCount === 0) {
    return {
      averageRating: 0,
      totalCount: 0,
      recommendationRate: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      categoryCounts: {},
    };
  }

  let ratingSum = 0;
  let recommendCount = 0;
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const categoryCounts: Record<string, number> = {};

  for (const r of records) {
    ratingSum += r.rating;
    if (r.wouldRecommend) recommendCount++;

    const clampedRating = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    ratingCounts[clampedRating] = (ratingCounts[clampedRating] || 0) + 1;

    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  }

  const averageRating = parseFloat((ratingSum / totalCount).toFixed(1));
  const recommendationRate = Math.round((recommendCount / totalCount) * 100);

  return {
    averageRating,
    totalCount,
    recommendationRate,
    ratingCounts,
    categoryCounts,
  };
}

export const ReviewsQuerySchema = z.object({
  category: z.string().trim().max(60).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(['helpful', 'recent']).optional(),
});

export const ReviewIdParamSchema = z.object({
  id: z.string().trim().min(3).max(100).regex(/^[a-zA-Z0-9_\-]+$/, 'Invalid review ID format'),
});

// GET /api/reviews - Get filtered and sorted reviews with summary statistics
router.get('/', async (req: Request, res: Response) => {
  try {
    const parsedQuery = ReviewsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: parsedQuery.error.issues });
    }

    const { category, rating: minRating, sort = 'helpful' } = parsedQuery.data;
    const list = await loadReviews();

    let filtered = [...list];

    if (category && category !== 'all') {
      filtered = filtered.filter((r) => r.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (minRating !== undefined) {
      filtered = filtered.filter((r) => r.rating >= minRating);
    }

    if (sort === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // sort by helpful desc, then rating desc
      filtered.sort((a, b) => b.helpful - a.helpful || b.rating - a.rating);
    }

    const summary = calculateSummary(list);

    res.json({
      reviews: filtered,
      summary,
    });
  } catch (err: any) {
    console.error('Error fetching reviews from database:', err);
    res.status(500).json({ error: 'Failed to retrieve reviews from database' });
  }
});

// GET /api/reviews/stats - Summary metrics only
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const list = await loadReviews();
    res.json(calculateSummary(list));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate stats' });
  }
});

export const CreateReviewSchema = z.object({
  authorName: z.string().trim().min(1, 'Author name is required').max(80),
  role: z.string().trim().max(80).optional(),
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  category: z.string().trim().max(60).optional(),
  title: z.string().trim().min(1, 'Review title is required').max(120),
  content: z.string().trim().min(5, 'Review content must be at least 5 characters').max(1500),
  wouldRecommend: z.boolean().optional(),
  avatarUrl: z.string().trim().max(255).optional(),
});

// POST /api/reviews - Add a new review to the database
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = CreateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid review data.';
      return res.status(400).json({ error: message, details: parsed.error.issues });
    }

    const { authorName, role, rating, category, title, content, wouldRecommend, avatarUrl } = parsed.data;

    const list = await loadReviews();

    const newReview: ReviewRecord = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorName,
      role: role || 'Chemistry Learner',
      avatarUrl: avatarUrl || '/favicon.png',
      rating,
      category: category || 'General Experience',
      title,
      content,
      wouldRecommend: wouldRecommend !== false,
      helpful: 0,
      verified: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [newReview, ...list];
    await saveReviews(updated);

    res.status(201).json({
      message: 'Review recorded in CHEMORA database successfully',
      review: newReview,
      summary: calculateSummary(updated),
    });
  } catch (err: any) {
    console.error('Error inserting review into database:', err);
    res.status(500).json({ error: 'Failed to record review in database' });
  }
});

// POST /api/reviews/:id/helpful - Upvote review helpfulness in database
router.post('/:id/helpful', async (req: Request, res: Response) => {
  try {
    const parsed = ReviewIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid review id format', details: parsed.error.issues });
    }

    const { id } = parsed.data;
    const list = await loadReviews();
    const index = list.findIndex((r) => r.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Review not found in database' });
    }

    list[index].helpful = (list[index].helpful || 0) + 1;
    await saveReviews(list);

    res.json({
      success: true,
      id,
      helpful: list[index].helpful,
    });
  } catch (err: any) {
    console.error('Error upvoting review:', err);
    res.status(500).json({ error: 'Failed to update helpfulness count' });
  }
});

export default router;
