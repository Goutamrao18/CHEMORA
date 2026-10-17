import { describe, it, expect } from 'vitest';
import {
  SignUpSchema,
  LoginSchema,
  SyncProgressSchema,
} from '../../server/routes/account';
import {
  CreateReviewSchema,
  ReviewsQuerySchema,
  ReviewIdParamSchema,
} from '../../server/routes/reviews';
import { CompoundQuerySchema } from '../../server';
import { AssistantRequestSchema } from '../../api/assistant.js';

describe('API Schema Validations (Zod)', () => {
  describe('Account Schemas', () => {
    it('validates valid user signup input', () => {
      const valid = {
        email: 'researcher@chemora.org',
        password: 'secureLaboratoryPassword123',
        full_name: 'Dr. Marie Curie',
      };
      const result = SignUpSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email on signup', () => {
      const invalid = {
        email: 'not-an-email',
        password: 'password123',
      };
      const result = SignUpSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects short passwords under 6 characters', () => {
      const invalid = {
        email: 'student@chemora.org',
        password: '123',
      };
      const result = SignUpSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates researcher progress sync data schema', () => {
      const progress = {
        experimentsCompleted: 12,
        challengesCompleted: 25,
        streakDays: 7,
        totalXp: 1540,
        rankTitle: 'Adept Alchemist',
        completedExperimentIds: ['exp-titration', 'exp-flame-test'],
      };
      const result = SyncProgressSchema.safeParse(progress);
      expect(result.success).toBe(true);
    });

    it('rejects negative numbers in progress data', () => {
      const invalid = {
        totalXp: -50,
      };
      const result = SyncProgressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Reviews Schemas', () => {
    it('validates correct review creation input', () => {
      const review = {
        authorName: 'Antoine Lavoisier',
        role: 'Chemistry Instructor',
        rating: 5,
        category: 'Guided Experiments',
        title: 'Masterclass in Stoichiometry',
        content: 'The 3D apparatus visualizer and step-by-step procedures are remarkably clear.',
        wouldRecommend: true,
      };
      const result = CreateReviewSchema.safeParse(review);
      expect(result.success).toBe(true);
    });

    it('rejects ratings outside 1-5 range', () => {
      const invalid = {
        authorName: 'Student',
        rating: 6,
        title: 'Test',
        content: 'Long enough content to pass',
      };
      const result = CreateReviewSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates review query filter parameters', () => {
      const query = {
        category: 'Guided Experiments',
        rating: '4',
        sort: 'recent',
      };
      const result = ReviewsQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe(4);
      }
    });

    it('validates review ID param format', () => {
      const valid = { id: 'rev_1712345678_abc12' };
      expect(ReviewIdParamSchema.safeParse(valid).success).toBe(true);

      const invalid = { id: '!!drop table--' };
      expect(ReviewIdParamSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('Science Compound Proxy Schema', () => {
    it('validates legitimate compound names', () => {
      expect(CompoundQuerySchema.safeParse({ name: 'Aspirin' }).success).toBe(true);
      expect(CompoundQuerySchema.safeParse({ name: 'Copper(II) sulfate' }).success).toBe(true);
      expect(CompoundQuerySchema.safeParse({ name: '1,3,7-Trimethylxanthine' }).success).toBe(true);
    });

    it('rejects empty or injection queries', () => {
      expect(CompoundQuerySchema.safeParse({ name: '' }).success).toBe(false);
      expect(CompoundQuerySchema.safeParse({ name: '<script>alert(1)</script>' }).success).toBe(false);
    });
  });

  describe('Assistant AI Request Schema', () => {
    it('validates prompt text within limits', () => {
      const req = {
        prompt: 'What is the reaction mechanism for acid-catalyzed esterification?',
        context: 'Workspace Context',
      };
      expect(AssistantRequestSchema.safeParse(req).success).toBe(true);
    });

    it('accepts image payload', () => {
      const req = {
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      };
      expect(AssistantRequestSchema.safeParse(req).success).toBe(true);
    });
  });
});
