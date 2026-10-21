import express from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  getSupabaseAdminClient,
  verifyUserSessionToken,
  backendGetProfile,
} from '../supabase.ts';

const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';

export interface ReviewRecord {
  id: string;
  user_id?: string;
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
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalCount: number;
  recommendationRate: number;
  ratingCounts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  categoryCounts: Record<string, number>;
}

function extractToken(req: Request): string | null {
  if (req.cookies && (req.cookies.chemora_session || req.cookies['__Host-chemora_session'])) {
    return req.cookies.chemora_session || req.cookies['__Host-chemora_session'];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

// 3.5: Plain text sanitization rules
function validateReviewPlainText(text: string): { valid: boolean; error?: string } {
  if (/<[a-z\/\!][\s\S]*>/i.test(text)) {
    return { valid: false, error: 'HTML formatting is not permitted in reviews.' };
  }
  const linkMatches = text.match(/https?:\/\/|www\./gi) || [];
  if (linkMatches.length > 1) {
    return { valid: false, error: 'Reviews may not contain more than one link.' };
  }
  if (/(.)\1{5,}/.test(text)) {
    return { valid: false, error: 'Excessive repeated characters are not permitted.' };
  }
  return { valid: true };
}

// In-memory dev cache only when Supabase is not provisioned
const devReviews: ReviewRecord[] = [];
const devVotes = new Set<string>(); // "reviewId:userId"

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
  id: z.string().trim().min(3).max(100),
});

// 3.3 & 3.5: Author name and avatar come from profile, NOT from the request
export const CreateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  category: z.string().trim().max(60).optional(),
  title: z.string().trim().min(2, 'Review title is required').max(120),
  content: z.string().trim().min(5, 'Review content must be at least 5 characters').max(1500),
  wouldRecommend: z.boolean().optional(),
});

// GET /api/reviews - 3.3: Return only 'approved' reviews from Supabase single source of truth
router.get('/', async (req: Request, res: Response) => {
  try {
    const parsedQuery = ReviewsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }

    const { category, rating: minRating, sort = 'helpful' } = parsedQuery.data;
    const admin = getSupabaseAdminClient();

    let approvedReviews: ReviewRecord[] = [];

    if (admin) {
      // 3.2: Single source of truth: row-level query from Supabase admin client where status = 'approved'
      let query = admin
        .from('chemora_reviews')
        .select('*')
        .eq('status', 'approved');

      if (category && category !== 'all') {
        query = query.ilike('category', `%${category}%`);
      }
      if (minRating !== undefined) {
        query = query.gte('rating', minRating);
      }

      if (sort === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('helpful', { ascending: false }).order('rating', { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data) {
        approvedReviews = data.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          authorName: r.author_name || 'Verified Chemist',
          role: r.role || 'Chemistry Learner',
          avatarUrl: r.avatar_url || '/favicon.png',
          rating: Number(r.rating || 5),
          category: r.category || 'General Experience',
          title: r.title,
          content: r.comment || r.content,
          wouldRecommend: r.would_recommend !== false,
          helpful: Number(r.helpful || 0),
          verified: Boolean(r.verified),
          status: 'approved',
          createdAt: r.created_at || new Date().toISOString(),
        }));
      }
    } else if (!isProd) {
      approvedReviews = devReviews.filter((r) => r.status === 'approved');
      if (category && category !== 'all') {
        approvedReviews = approvedReviews.filter((r) => r.category.toLowerCase().includes(category.toLowerCase()));
      }
      if (minRating !== undefined) {
        approvedReviews = approvedReviews.filter((r) => r.rating >= minRating);
      }
    }

    const summary = calculateSummary(approvedReviews);
    return res.json({
      reviews: approvedReviews,
      summary,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
});

// GET /api/reviews/stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const admin = getSupabaseAdminClient();
    let approvedReviews: ReviewRecord[] = [];
    if (admin) {
      const { data } = await admin.from('chemora_reviews').select('*').eq('status', 'approved');
      if (data) {
        approvedReviews = data.map((r: any) => ({
          id: r.id,
          authorName: r.author_name,
          role: r.role || 'Chemistry Learner',
          rating: Number(r.rating || 5),
          category: r.category || 'General Experience',
          title: r.title,
          content: r.comment || r.content,
          wouldRecommend: r.would_recommend !== false,
          helpful: Number(r.helpful || 0),
          verified: Boolean(r.verified),
          status: 'approved',
          createdAt: r.created_at,
        }));
      }
    } else if (!isProd) {
      approvedReviews = devReviews.filter((r) => r.status === 'approved');
    }
    return res.json(calculateSummary(approvedReviews));
  } catch {
    return res.status(500).json({ error: 'Failed to calculate stats' });
  }
});

// 3.3: POST /api/reviews - Requires login; takes authorName & avatar from profile; defaults to 'pending'
router.post('/', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'You must be logged in to submit a review.' });
    }

    const verifiedUser = await verifyUserSessionToken(token);
    if (!verifiedUser || !verifiedUser.id) {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in.' });
    }

    const parsed = CreateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid review fields.' });
    }

    const { rating, category, title, content, wouldRecommend } = parsed.data;

    // 3.5: Plain-text validation (no HTML, limited links, no repeated characters)
    const titleCheck = validateReviewPlainText(title);
    if (!titleCheck.valid) return res.status(400).json({ error: titleCheck.error });

    const contentCheck = validateReviewPlainText(content);
    if (!contentCheck.valid) return res.status(400).json({ error: contentCheck.error });

    // 3.3: Pull verified identity from profile (never trust client-supplied name or avatar)
    const profile = await backendGetProfile(verifiedUser.id, verifiedUser.email, undefined, token);
    const authorName = profile.full_name || 'Verified Chemist';
    const avatarUrl = profile.avatar_url || '/favicon.png';
    const role = profile.rank || 'Chemistry Learner';

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const admin = getSupabaseAdminClient();

    if (admin) {
      // Check if user already reviewed (one review per user)
      const existing = await admin.from('chemora_reviews').select('id').eq('user_id', verifiedUser.id).maybeSingle();
      if (existing.data) {
        return res.status(400).json({ error: 'You have already submitted a review.' });
      }

      // 3.3: New reviews are strictly 'pending'
      const { error: insertErr } = await admin.from('chemora_reviews').insert({
        id: reviewId,
        user_id: verifiedUser.id,
        author_name: authorName,
        role,
        avatar_url: avatarUrl,
        rating,
        category: category || 'General Experience',
        title,
        comment: content,
        would_recommend: wouldRecommend !== false,
        helpful: 0,
        verified: true, // 3.5: Verified can only be set by the server
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      if (insertErr) {
        return res.status(500).json({ error: 'Failed to record review.' });
      }
    } else if (!isProd) {
      devReviews.push({
        id: reviewId,
        user_id: verifiedUser.id,
        authorName,
        role,
        avatarUrl,
        rating,
        category: category || 'General Experience',
        title,
        content,
        wouldRecommend: wouldRecommend !== false,
        helpful: 0,
        verified: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } else {
      return res.status(503).json({ error: 'Database service is currently unavailable.' });
    }

    return res.status(201).json({
      success: true,
      message: 'Your review has been submitted and is pending moderation.',
      status: 'pending',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'An unexpected error occurred while saving review.' });
  }
});

// 3.4: POST /api/reviews/:id/helpful - Helpful votes: login required, 1 vote per user per review
router.post('/:id/helpful', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Login required to vote on reviews.' });
    }

    const verifiedUser = await verifyUserSessionToken(token);
    if (!verifiedUser || !verifiedUser.id) {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in.' });
    }

    const parsed = ReviewIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }

    const { id: reviewId } = parsed.data;
    const admin = getSupabaseAdminClient();

    if (admin) {
      // Insert vote into review_votes (primary key review_id, user_id prevents duplicate votes)
      const { error: voteErr } = await admin.from('review_votes').insert({
        review_id: reviewId,
        user_id: verifiedUser.id,
      });

      if (voteErr) {
        // Duplicate vote code or constraint violation: return current count without double-counting
        if (voteErr.code === '23505') {
          return res.status(400).json({ error: 'You have already marked this review as helpful.' });
        }
      }

      // Compute total count from review_votes
      const countRes = await admin
        .from('review_votes')
        .select('user_id', { count: 'exact', head: true })
        .eq('review_id', reviewId);

      const totalHelpful = countRes.count || 1;

      // Update cached helpful count on review
      await admin.from('chemora_reviews').update({ helpful: totalHelpful }).eq('id', reviewId);

      return res.json({
        success: true,
        id: reviewId,
        helpful: totalHelpful,
      });
    } else if (!isProd) {
      const voteKey = `${reviewId}:${verifiedUser.id}`;
      if (devVotes.has(voteKey)) {
        return res.status(400).json({ error: 'You have already marked this review as helpful.' });
      }
      devVotes.add(voteKey);
      const rev = devReviews.find((r) => r.id === reviewId);
      if (rev) {
        rev.helpful = (rev.helpful || 0) + 1;
        return res.json({ success: true, id: reviewId, helpful: rev.helpful });
      }
      return res.json({ success: true, id: reviewId, helpful: 1 });
    }

    return res.status(503).json({ error: 'Database service is currently unavailable.' });
  } catch {
    return res.status(500).json({ error: 'Failed to record vote.' });
  }
});

export default router;
