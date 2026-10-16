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
    const res = await fetch(`/api/reviews${queryStr}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
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
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to submit review to database');
  }

  const data = await res.json();
  return data.review;
}

export async function upvoteDatabaseReview(reviewId: string): Promise<number> {
  const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Failed to upvote review');
  }

  const data = await res.json();
  return data.helpful;
}
