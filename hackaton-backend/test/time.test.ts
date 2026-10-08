import { describe, expect, it } from 'vitest';
import {
  addOneYearEndOfDay,
  endOfDayGuayaquil,
  endOfMonthGuayaquil,
  guayaquilDate,
  startOfMonthGuayaquil,
} from '../src/shared/time';

describe('Guayaquil calendar boundaries', () => {
  it('uses the local civil day around midnight UTC', () => {
    const instant = new Date('2026-10-08T02:00:00.000Z');
    expect(guayaquilDate(instant).toISOString()).toBe(
      '2026-10-07T00:00:00.000Z',
    );
    expect(endOfDayGuayaquil(instant).toISOString()).toBe(
      '2026-10-08T04:59:59.999Z',
    );
  });

  it('clamps February 29 on the next non-leap year', () => {
    expect(
      addOneYearEndOfDay(new Date('2024-02-29T15:00:00.000Z')).toISOString(),
    ).toBe('2025-03-01T04:59:59.999Z');
  });

  it('finds month boundaries in local time', () => {
    const instant = new Date('2026-10-08T12:00:00.000Z');
    expect(startOfMonthGuayaquil(instant).toISOString()).toBe(
      '2026-10-01T05:00:00.000Z',
    );
    expect(endOfMonthGuayaquil(instant).toISOString()).toBe(
      '2026-11-01T04:59:59.999Z',
    );
  });
});
