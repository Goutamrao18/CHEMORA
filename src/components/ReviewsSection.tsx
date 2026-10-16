import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  ThumbsUp,
  MessageSquarePlus,
  Filter,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send,
  X,
  Database,
  RefreshCw,
  Flame,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  fetchDatabaseReviews,
  submitDatabaseReview,
  upvoteDatabaseReview,
  ReviewItem,
  ReviewSummaryStats,
} from '../services/reviewService';
import { getStoredProfile } from '../data/userProfile';

const CATEGORIES = [
  'All',
  'Virtual 3D Lab & Nuclear Core',
  'Practical Experiments & Videos',
  '100 Progressive Challenges',
  'Knowledge Library & Glossary',
];

const ROLES = [
  'Chemistry Student',
  'AP Chemistry Educator',
  'Undergraduate Biochemist',
  'University Researcher',
  'Radiochemist / Lab Tech',
  'Science Enthusiast',
];

export const ReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<ReviewSummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [sortOption, setSortOption] = useState<'helpful' | 'recent'>('helpful');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  // Form State
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState(ROLES[0]);
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [formCategory, setFormCategory] = useState(CATEGORIES[1]);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formRecommend, setFormRecommend] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Initialize author name from stored profile if available
  useEffect(() => {
    const profile = getStoredProfile();
    if (profile && profile.name && profile.name !== 'Guest Alchemist') {
      setFormName(profile.name);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchDatabaseReviews({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        rating: selectedRatingFilter === 'all' ? undefined : selectedRatingFilter,
        sort: sortOption,
      });
      setReviews(data.reviews);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to load database reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedRatingFilter, sortOption]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (upvotedIds.has(id)) return;

    // Optimistic UI update
    setUpvotedIds((prev) => new Set([...prev, id]));
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpful: r.helpful + 1 } : r))
    );

    try {
      await upvoteDatabaseReview(id);
    } catch (err) {
      console.error('Error upvoting review:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTitle.trim() || !formContent.trim()) {
      setSubmitError('Please fill in your name, title, and review description.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await submitDatabaseReview({
        authorName: formName.trim(),
        role: formRole,
        rating: formRating,
        category: formCategory,
        title: formTitle.trim(),
        content: formContent.trim(),
        wouldRecommend: formRecommend,
      });

      // Confetti burst
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#10b981', '#f59e0b', '#b06bff'],
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowSubmitModal(false);
        // Reset non-name fields
        setFormTitle('');
        setFormContent('');
      }, 1500);

      // Prepend to reviews
      setReviews((prev) => [created, ...prev]);
      if (summary) {
        setSummary({
          ...summary,
          totalCount: summary.totalCount + 1,
        });
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Could not save review to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-[#0c192e]/90 via-[#071428]/90 to-[#040c1a]/95 border border-cyan-500/25 rounded-[32px] p-6 sm:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.35)] relative overflow-hidden">
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Database Status Badge */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-cyan-950/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-[0.2em] uppercase flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              DATABASE SYSTEM REVIEW
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              POSTGRESQL &amp; JSON PERSISTENCE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Learner Feedback &amp; Reviews
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real reviews and research ideas recorded directly into the CHEMORA database. No email clients required.
          </p>
        </div>

        {/* Primary Action: Write Review */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl bg-[#08152a] hover:bg-[#0c2242] border border-cyan-900/60 text-slate-300 hover:text-white transition"
            title="Refresh Database Reviews"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(0,240,255,0.4)] transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
        </div>
      </div>

      {/* Aggregate Score & Distribution Banner - Only shown when authentic reviews exist in DB */}
      {summary && summary.totalCount > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-8 p-5 rounded-2xl bg-[#061226]/80 border border-cyan-900/50 backdrop-blur-sm">
          {/* Left: Overall Rating */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-cyan-950/80">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-1">
              {summary.averageRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(summary.averageRating)
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-slate-400">
              Based on <strong className="text-white">{summary.totalCount}</strong> verified review{summary.totalCount > 1 ? 's' : ''}
            </span>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{summary.recommendationRate}% Recommend CHEMORA</span>
            </div>
          </div>

          {/* Right: Star Distribution Bars */}
          <div className="md:col-span-8 flex flex-col justify-center gap-2 p-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary.ratingCounts[stars as 1 | 2 | 3 | 4 | 5] || 0;
              const pct = summary.totalCount > 0 ? (count / summary.totalCount) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-12 text-slate-400 flex items-center gap-1">
                    {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 bg-[#020714] h-2.5 rounded-full overflow-hidden border border-cyan-950">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-slate-400 font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-2xl bg-[#061226]/60 border border-cyan-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Database review table is active. No reviews submitted yet.</span>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 font-bold"
          >
            Submit the first review →
          </button>
        </div>
      )}

      {/* Filter & Sorting Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-[#061226] border border-cyan-950 text-slate-300 hover:text-white hover:border-cyan-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort and Rating Selector */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as 'helpful' | 'recent')}
            className="px-3 py-1.5 rounded-xl bg-[#061226] border border-cyan-950 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="helpful">Sort: Most Helpful 👍</option>
            <option value="recent">Sort: Most Recent ⏱</option>
          </select>

          <select
            value={selectedRatingFilter}
            onChange={(e) =>
              setSelectedRatingFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
            }
            className="px-3 py-1.5 rounded-xl bg-[#061226] border border-cyan-950 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Stars</option>
            <option value="5">5 Stars only</option>
            <option value="4">4+ Stars</option>
          </select>
        </div>
      </div>

      {/* Reviews Card Grid */}
      {reviews.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-2xl bg-[#061226]/80 border border-cyan-950/80">
          <Database className="w-9 h-9 text-cyan-400 mx-auto mb-3 opacity-60" />
          <h4 className="text-base font-bold text-white mb-1.5">No reviews recorded yet</h4>
          <p className="text-xs text-slate-400 mb-5 max-w-md mx-auto">
            Reviews are saved to the database in real-time when submitted by learners. Be the first to share your experience with the 3D Virtual Lab, challenges, or experiments!
          </p>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-6 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition shadow-[0_0_20px_rgba(0,240,255,0.3)] inline-flex items-center gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Write the First Review</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((rev) => {
            const isUpvoted = upvotedIds.has(rev.id);
            const dateStr = new Date(rev.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <article
                key={rev.id}
                className="p-5 rounded-2xl bg-[#07152b]/90 border border-cyan-950 hover:border-cyan-500/50 transition-all duration-200 flex flex-col justify-between shadow-lg group hover:-translate-y-0.5"
              >
                <div>
                  {/* Top: Star rating & Verified badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>

                    {rev.verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>

                  {/* Category Pill */}
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1.5 font-bold">
                    {rev.category}
                  </span>

                  {/* Review Title */}
                  <h3 className="text-sm sm:text-base font-bold text-white mb-2 leading-snug group-hover:text-cyan-200 transition">
                    "{rev.title}"
                  </h3>

                  {/* Review Content */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {rev.content}
                  </p>
                </div>

                {/* Footer: Author Info & Helpful Button */}
                <div className="pt-3 border-t border-cyan-950/70 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{rev.authorName}</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                      {rev.role} · {dateStr}
                    </span>
                  </div>

                  {/* Upvote Button */}
                  <button
                    onClick={(e) => handleUpvote(rev.id, e)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition ${
                      isUpvoted
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                        : 'bg-[#030916] text-slate-400 hover:text-white border border-cyan-950 hover:border-cyan-800'
                    }`}
                    title="Mark this review as helpful"
                  >
                    <ThumbsUp className={`w-3 h-3 ${isUpvoted ? 'text-cyan-300 fill-cyan-300' : ''}`} />
                    <span>{rev.helpful}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUBMIT REVIEW MODAL */}
      {/* -------------------------------------------------------------------- */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#08152a] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-950">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Write a Review for CHEMORA</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mx-auto text-emerald-300">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Review Saved in Database!</h4>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  Thank you! Your feedback is now permanently stored in the CHEMORA database and visible to other learners worldwide.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                {/* Rating Picker */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (hoverRating ?? formRating)
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-mono text-amber-300 font-bold text-xs">
                      {formRating === 5
                        ? '5 - Outstanding'
                        : formRating === 4
                        ? '4 - Very Good'
                        : formRating === 3
                        ? '3 - Good'
                        : formRating === 2
                        ? '2 - Needs Improvement'
                        : '1 - Poor'}
                    </span>
                  </div>
                </div>

                {/* Name & Role Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Your Name / Alias</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Dr. Jordan Reed"
                      className="w-full px-3 py-2 rounded-xl bg-[#040e24] border border-cyan-950 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Learner Role</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#040e24] border border-cyan-950 text-white focus:outline-none focus:border-cyan-400 font-mono"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Primary Area Covered</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#040e24] border border-cyan-950 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Review Headline</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. The 3D Atomic Reaction Bay makes nuclear kinetics intuitive"
                    className="w-full px-3 py-2 rounded-xl bg-[#040e24] border border-cyan-950 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                {/* Detailed Content */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Detailed Experience &amp; Feedback</label>
                  <textarea
                    required
                    rows={3}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Describe what you learned, which practical or nuclear reaction you ran, and what ideas or features you'd like to see next..."
                    className="w-full px-3 py-2 rounded-xl bg-[#040e24] border border-cyan-950 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono resize-none"
                  />
                </div>

                {/* Recommend Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="recommendCheck"
                    checked={formRecommend}
                    onChange={(e) => setFormRecommend(e.target.checked)}
                    className="accent-cyan-400 rounded w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="recommendCheck" className="text-slate-300 cursor-pointer text-xs">
                    I recommend CHEMORA to other students, teachers, and chemistry researchers
                  </label>
                </div>

                {submitError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-mono">
                    {submitError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider uppercase transition flex items-center gap-2 shadow-lg"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Saving to DB...' : 'Save to Database'}</span>
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
