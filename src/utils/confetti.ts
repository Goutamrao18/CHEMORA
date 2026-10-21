import type { Options } from 'canvas-confetti';

/**
 * Lazily loads and fires canvas-confetti only when a victory/milestone occurs.
 * Prevents canvas-confetti from blocking the initial page bundle.
 */
export async function fireConfetti(options?: Options): Promise<void> {
  try {
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default || confettiModule;
    confetti(options);
  } catch (err) {
    console.warn('Confetti animation unavailable:', err);
  }
}
