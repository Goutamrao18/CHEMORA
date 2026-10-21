// Client Service for CHEMORA Database-Backed Reviews System

export interface ReviewItem {
  id: string;
  authorName: string;
  role: string;
  avatarUrl?: string;
  rating: number; // 1-5
  category: string;
  title: string;
  content: string;
  wouldRecommend: boolean;
  helpful: number;
  verified: boolean;
  createdAt: string;
}

export interface ReviewSummaryStats {
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

export interface SubmitReviewInput {
  authorName: string;
  role: string;
  rating: number;
  category: string;
  title: string;
  content: string;
  wouldRecommend: boolean;
  avatarUrl?: string;
}

import { fetchWithRetry, fetchJsonWithRetry } from '../utils/fetchWithRetry';

export async function fetchDatabaseReviews(filters?: {
  category?: string;
  rating?: number;
  sort?: 'helpful' | 'recent';
}): Promise<{ reviews: ReviewItem[]; summary: ReviewSummaryStats }> {
  try {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'all') {
      params.append('category', filters.category);
    }
    if (filters?.rating) {
      params.append('rating', filters.rating.toString());
    }
    if (filters?.sort) {
      params.append('sort', filters.sort);
    }

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const data = await fetchJsonWithRetry<{ reviews: ReviewItem[]; summary: ReviewSummaryStats }>(
      `/api/reviews${queryStr}`,
      { timeoutMs: 8000, retries: 2 }
    );

    return {
      reviews: data.reviews || [],
      summary: data.summary || {
        averageRating: 0,
        totalCount: 0,
        recommendationRate: 0,
        ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        categoryCounts: {},
      },
    };
  } catch (err) {
    console.warn('Could not fetch reviews:', err);
    return {
      reviews: [],
      summary: {
        averageRating: 0,
        totalCount: 0,
        recommendationRate: 0,
        ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        categoryCounts: {},
      },
    };
  }
}

export async function submitDatabaseReview(input: SubmitReviewInput): Promise<ReviewItem> {
  const data = await fetchJsonWithRetry<{ review: ReviewItem }>(
    '/api/reviews',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      timeoutMs: 10000,
      retries: 1,
    }
  );

  return data.review;
}

export async function upvoteDatabaseReview(reviewId: string): Promise<number> {
  const data = await fetchJsonWithRetry<{ helpful: number }>(
    `/api/reviews/${encodeURIComponent(reviewId)}/helpful`,
    {
      method: 'POST',
      timeoutMs: 6000,
      retries: 1,
    }
  );

  return data.helpful;
}
