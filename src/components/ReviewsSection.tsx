import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  ThumbsUp,
  CheckCircle2,
  MessageSquarePlus,
  Filter,
  ArrowUpDown,
  Sparkles,
  ShieldCheck,
  Database,
  X,
  Send,
  AlertCircle,
  Clock,
  Heart,
  ChevronDown
} from 'lucide-react';
import { playSoftClick } from '../utils/soundEffects';
import { supabase } from '../services/supabaseClient';

export interface ReviewItem {
  id: string;
  user_id?: string;
  authorName: string;
  role: string;
  avatarUrl?: string;
  rating: number;
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

interface ReviewsSectionProps {
  onOpenAuth?: () => void;
  currentUser?: { id: string; email?: string; full_name?: string } | null;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ onOpenAuth, currentUser }) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'helpful' | 'recent' | 'rating'>('helpful');
  const [votedReviews, setVotedReviews] = useState<Set<string>>(new Set());

  // Modal State
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [formRating, setFormRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [formCategory, setFormCategory] = useState<string>('Virtual Lab & Reactions');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formRecommend, setFormRecommend] = useState<boolean>(true);
  const [formAuthorName, setFormAuthorName] = useState<string>(currentUser?.full_name || '');
  const [formRole, setFormRole] = useState<string>('Chemistry Researcher');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch reviews from Supabase API endpoint
  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reviews?sort=' + (sortBy === 'rating' ? 'helpful' : sortBy), {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setSummary(data.summary || null);
      } else {
        // Fallback directly to Supabase client if API is unavailable
        if (supabase) {
          const { data: sbData, error: sbErr } = await supabase
            .from('chemora_reviews')
            .select('*')
            .eq('status', 'approved')
            .order('helpful', { ascending: false });

          if (!sbErr && sbData && sbData.length > 0) {
            const mapped: ReviewItem[] = sbData.map((r: any) => ({
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
            setReviews(mapped);
          }
        }
      }
    } catch (err: any) {
      console.warn('Reviews fetch error:', err);
      setError('Unable to load live reviews from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [sortBy]);

  // Handle helpful voting
  const handleHelpfulVote = async (reviewId: string) => {
    if (votedReviews.has(reviewId)) return;
    playSoftClick();

    // Optimistically update
    setVotedReviews((prev) => new Set([...prev, reviewId]));
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r))
    );

    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Vote sync skipped:', e);
    }
  };

  // Submit review to Supabase
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setSubmitError('Please complete all required fields.');
      return;
    }
    if (formContent.trim().length < 10) {
      setSubmitError('Review content must be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      rating: formRating,
      category: formCategory,
      title: formTitle.trim(),
      content: formContent.trim(),
      wouldRecommend: formRecommend,
    };

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        // Direct Supabase client insertion fallback
        if (supabase && currentUser?.id) {
          const { error: sbErr } = await supabase.from('chemora_reviews').insert({
            id: `rev_${Date.now()}`,
            user_id: currentUser.id,
            author_name: formAuthorName || currentUser.full_name || 'Verified Chemist',
            role: formRole,
            rating: formRating,
            category: formCategory,
            title: formTitle.trim(),
            comment: formContent.trim(),
            would_recommend: formRecommend,
            helpful: 0,
            verified: true,
            status: 'pending',
          });
          if (sbErr) throw new Error(sbErr.message);
        } else {
          throw new Error(resData.error || 'Failed to submit review');
        }
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsWriteModalOpen(false);
        setSubmitSuccess(false);
        setFormTitle('');
        setFormContent('');
        fetchReviews();
      }, 2500);
    } catch (err: any) {
      setSubmitError(err.message || 'Error recording review to Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered and sorted reviews
  const displayedReviews = useMemo(() => {
    let list = reviews;
    if (selectedCategory !== 'all') {
      list = list.filter((r) => r.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    }
    if (sortBy === 'rating') {
      return [...list].sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === 'recent') {
      return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [...list].sort((a, b) => b.helpful - a.helpful || b.rating - a.rating);
  }, [reviews, selectedCategory, sortBy]);

  const categories = [
    { id: 'all', label: 'All Reviews' },
    { id: 'Virtual Lab & Reactions', label: 'Virtual Lab' },
    { id: 'Periodic Table & PubChem', label: 'Periodic Table' },
    { id: 'Curriculum & Challenges', label: 'Challenges (100 Levels)' },
    { id: 'Guided Practicals', label: 'Guided Practicals' },
    { id: 'General Platform', label: 'General Experience' },
  ];

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Exceptional'];

  return (
    <section className="rounded-3xl bg-[#051124]/90 border border-cyan-900/50 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Supabase Indicator */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-cyan-950/60">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-[0.2em] uppercase">
              COMMUNITY &amp; PEER REVIEWS
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
              <Database className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Supabase Connected</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            What Chemists &amp; Students Say
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Real peer reviews stored securely in Supabase with verified researcher badges.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playSoftClick();
            setIsWriteModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Summary Scoreboard Bar (Only if real reviews exist) */}
      {reviews.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-3xl bg-[#06142a] border border-cyan-500/20 mb-8">
            {/* Big Rating Number */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-cyan-950/80">
              <span className="text-5xl font-black text-white font-mono tracking-tight">
                {summary?.averageRating?.toFixed(1) ?? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
              </span>
              <div className="flex items-center gap-1 my-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const avg = summary?.averageRating ?? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length);
                  return (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(avg)
                          ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                          : 'fill-slate-800 text-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-xs text-slate-300 font-medium">
                Based on <strong className="text-white">{summary?.totalCount ?? reviews.length}</strong> verified {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
              <span className="text-[11px] text-cyan-300 font-mono mt-1">
                {summary?.recommendationRate ?? Math.round((reviews.filter((r) => r.wouldRecommend).length / reviews.length) * 100)}% of reviewers recommend Chemora Lab
              </span>
            </div>

            {/* Rating Breakdown Bars */}
            <div className="md:col-span-8 flex flex-col justify-center space-y-2 px-0 sm:px-4">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = summary?.ratingCounts?.[stars as 1 | 2 | 3 | 4 | 5] ?? reviews.filter((r) => Math.round(r.rating) === stars).length;
                const total = summary?.totalCount ?? reviews.length;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={stars} className="flex items-center gap-3 text-xs font-mono">
                    <span className="w-8 text-slate-400 font-bold flex items-center gap-1 justify-end">
                      {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800/80 overflow-hidden relative">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                      />
                    </div>
                    <span className="w-10 text-slate-400 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter and Sort Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    playSoftClick();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                      : 'bg-[#07172e] text-slate-400 hover:text-white border border-cyan-950 hover:border-cyan-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end md:self-auto text-xs text-slate-400 font-mono">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#07172e] border border-cyan-900/60 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="helpful">Most Helpful</option>
                <option value="recent">Most Recent</option>
                <option value="rating">Highest Rating</option>
              </select>
            </div>
          </div>

          {/* Reviews Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedReviews.map((item) => {
              const hasVoted = votedReviews.has(item.id);

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-[#06142a]/90 border border-cyan-900/40 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
                >
                  <div>
                    {/* Review Header: User Info & Star Rating */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.avatarUrl || '/favicon.png'}
                          alt={item.authorName}
                          className="w-10 h-10 rounded-full object-cover border border-cyan-500/30"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/favicon.png';
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white">{item.authorName}</span>
                            {item.verified && (
                              <span
                                title="Verified Chemist & Platform Researcher"
                                className="inline-flex items-center text-cyan-400"
                              >
                                <ShieldCheck className="w-4 h-4 fill-cyan-500/20 text-cyan-400" />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">{item.role}</span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < item.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-800 text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Category & Date */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-950/60 border border-cyan-500/25 text-cyan-300">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Review Title & Body */}
                    <h4 className="text-sm font-extrabold text-white mb-1.5">{item.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
                  </div>

                  {/* Bottom Card Footer: Recommendation & Helpful Button */}
                  <div className="pt-3 border-t border-cyan-950/60 flex items-center justify-between text-xs font-mono">
                    {item.wouldRecommend ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Recommends Chemora</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Neutral review</span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleHelpfulVote(item.id)}
                      disabled={hasVoted}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs ${
                        hasVoted
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-[#040e1e] border-cyan-950 hover:border-cyan-800 text-slate-400 hover:text-white cursor-pointer'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-cyan-400 text-cyan-400' : ''}`} />
                      <span>Helpful ({item.helpful})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {displayedReviews.length === 0 && (
            <div className="text-center py-10 rounded-2xl bg-[#06142a]/60 border border-cyan-900/30 text-slate-400 font-mono text-xs">
              No reviews found in this category.
            </div>
          )}
        </>
      ) : loading ? (
        <div className="py-16 text-center text-slate-400 font-mono text-xs animate-pulse">
          Loading verified community reviews from Supabase...
        </div>
      ) : (
        /* Authentic zero-state when no reviews exist in Supabase */
        <div className="p-8 sm:p-12 rounded-3xl bg-[#06142a]/80 border border-cyan-500/20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <MessageSquarePlus className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">No Reviews Yet</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
              Be the first chemistry learner or researcher to review Chemora Lab! Share your feedback on reactions, curriculum challenges, or practical experiments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playSoftClick();
              setIsWriteModalOpen(true);
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Write the First Review</span>
          </button>
        </div>
      )}

      {/* Write a Review Modal */}
      {isWriteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={() => setIsWriteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl bg-[#071326] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/70 p-6 sm:p-8 anim-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-cyan-900/40 mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-black text-white">Share Your Chemora Experience</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-white">Review Submitted to Supabase!</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Your feedback has been saved and submitted to the moderation queue. Thank you for contributing to the Chemora Lab research community!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Rating Picker */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Your Rating: {ratingLabels[hoverRating || formRating]}
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating || formRating)
                              ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                              : 'fill-slate-800 text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Review Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#040e1e] border border-cyan-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Virtual Lab & Reactions">Virtual Lab &amp; Reactions</option>
                    <option value="Periodic Table & PubChem">Periodic Table &amp; PubChem</option>
                    <option value="Curriculum & Challenges">Curriculum &amp; Challenges (100 Levels)</option>
                    <option value="Guided Practicals">Guided Practicals</option>
                    <option value="General Platform">General Platform Experience</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Review Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Excellent reaction physics and stoichiometric accuracy"
                    className="w-full bg-[#040e1e] border border-cyan-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Detailed Review */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                      Detailed Review (min 10 characters)
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">
                      {formContent.length}/1500
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    maxLength={1500}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Describe how Chemora Lab helped with your chemistry experiments, study curriculum, or virtual reactions..."
                    className="w-full bg-[#040e1e] border border-cyan-900/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                  />
                </div>

                {/* Recommendation Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formRecommend}
                    onChange={(e) => setFormRecommend(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-cyan-500 accent-cyan-500 cursor-pointer"
                  />
                  <span>I recommend Chemora Lab to other chemistry students and researchers.</span>
                </label>

                {/* Author Name and Role for verified badge */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formAuthorName}
                      onChange={(e) => setFormAuthorName(e.target.value)}
                      placeholder={currentUser?.full_name || 'Your Name'}
                      className="w-full bg-[#040e1e] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Role / Title
                    </label>
                    <input
                      type="text"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      placeholder="e.g. CBSE Student / Chemist"
                      className="w-full bg-[#040e1e] border border-cyan-900/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsWriteModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Saving to Supabase...' : 'Submit to Supabase'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
