import { describe, it, expect } from 'vitest';
import { totalBathrooms, bathroomsTooltip } from './bathrooms';

describe('totalBathrooms', () => {
  it('sums banyos + aseos', () => {
    expect(totalBathrooms(1, 1)).toBe(2);
    expect(totalBathrooms(2, 3)).toBe(5);
  });

  it('treats undefined / null as 0', () => {
    expect(totalBathrooms(undefined, undefined)).toBe(0);
    expect(totalBathrooms(null, null)).toBe(0);
    expect(totalBathrooms(2, undefined)).toBe(2);
    expect(totalBathrooms(undefined, 1)).toBe(1);
  });

  it('coerces string inputs (defensive for JSONB reads)', () => {
    expect(totalBathrooms('1' as unknown as number, '2' as unknown as number)).toBe(3);
  });
});

describe('bathroomsTooltip', () => {
  it('returns undefined when there is no breakdown to show', () => {
    expect(bathroomsTooltip(0, 0)).toBeUndefined();
    expect(bathroomsTooltip(2, 0)).toBeUndefined();
    expect(bathroomsTooltip(0, 1)).toBeUndefined();
    expect(bathroomsTooltip(undefined, undefined)).toBeUndefined();
  });

  it('formats singular/plural correctly', () => {
    expect(bathroomsTooltip(1, 1)).toBe('1 baño + 1 aseo');
    expect(bathroomsTooltip(2, 1)).toBe('2 baños + 1 aseo');
    expect(bathroomsTooltip(1, 2)).toBe('1 baño + 2 aseos');
    expect(bathroomsTooltip(3, 2)).toBe('3 baños + 2 aseos');
  });
});
