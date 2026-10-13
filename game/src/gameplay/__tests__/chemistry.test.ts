import { describe, expect, it } from 'vitest';
import {
  addReagentToContainer,
  createEmptyContainer,
  simulateTitration,
  transferBetweenContainers,
} from '../chemistry';

describe('chemistry engine', () => {
  it('recognizes the neutralization reaction when valid reagents are combined', () => {
    let content = createEmptyContainer('beaker');
    content = addReagentToContainer(content, 'naoh', 20);
    content = addReagentToContainer(content, 'phenolphthalein', 2);
    content = addReagentToContainer(content, 'hcl', 20);
    expect(content.completedReactionId).toBe('protocol_1_neutralization');
    expect(content.productName).toContain('Neutral Saline');
  });

  it('transfers proportional reagent quantities and conserves transferred volume', () => {
    const source = addReagentToContainer(createEmptyContainer('beaker'), 'h2o', 40);
    const target = createEmptyContainer('flask');
    const result = transferBetweenContainers(source, target, 10, 250);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source.volumeMl).toBeCloseTo(30, 1);
    expect(result.target.volumeMl).toBeCloseTo(10, 1);
    expect(result.source.reagents.h2o).toBeCloseTo(30, 5);
    expect(result.target.reagents.h2o).toBeCloseTo(10, 5);
  });

  it('moves titration pH toward the basic range when base is added', () => {
    const acidic = addReagentToContainer(createEmptyContainer('beaker'), 'hcl', 10);
    const titrated = simulateTitration(acidic, 5);
    expect(titrated.reagents.naoh).toBe(5);
    expect(titrated.volumeMl).toBeGreaterThan(acidic.volumeMl);
    expect(titrated.ph).toBeGreaterThan(acidic.ph);
  });

  it.each([
    [0, 'invalid-volume'] as const,
    [-1, 'invalid-volume'] as const,
    [Number.NaN, 'invalid-volume'] as const,
    [Infinity, 'invalid-volume'] as const,
  ])('rejects invalid transfer amount %s', (amount, reason) => {
    const source = addReagentToContainer(createEmptyContainer('beaker'), 'h2o', 10);
    const result = transferBetweenContainers(source, createEmptyContainer('flask'), amount, 250);
    expect(result).toEqual({ ok: false, reason });
  });

  it('rejects unknown reagents and non-finite additions without mutating content', () => {
    const original = createEmptyContainer('beaker');
    expect(addReagentToContainer(original, 'not-a-reagent', 5)).toBe(original);
    expect(addReagentToContainer(original, 'h2o', Number.NaN)).toBe(original);
    expect(addReagentToContainer(original, 'h2o', -2)).toBe(original);
  });

  it('rejects source underflow and destination overflow', () => {
    const source = addReagentToContainer(createEmptyContainer('beaker'), 'h2o', 5);
    const target = addReagentToContainer(createEmptyContainer('flask'), 'h2o', 245);
    expect(transferBetweenContainers(source, target, 6, 250)).toEqual({ ok: false, reason: 'insufficient-source' });
    expect(transferBetweenContainers(source, target, 10, 250)).toEqual({ ok: false, reason: 'insufficient-source' });
    const fullTarget = addReagentToContainer(createEmptyContainer('flask'), 'h2o', 250);
    expect(transferBetweenContainers(source, fullTarget, 1, 250)).toEqual({ ok: false, reason: 'destination-overflow' });
  });
});
