import {
  calculateElapsedTime,
  calculateErrorCount,
  calculateAccuracy,
  calculateWPM,
  calculateRoundMetrics,
} from '../js/metrics.js';

describe('metrics calculations', () => {
  it('calculates elapsed time in seconds', () => {
    expect(calculateElapsedTime(1000, 4000)).toBe(3);
  });

  it('throws an error when end time is before start time', () => {
    expect(() => {
      calculateElapsedTime(4000, 1000);
    }).toThrowError('End time cannot be before start time.');
  });

  it('returns 0 errors for an exact match', () => {
    expect(calculateErrorCount('<h1>', '<h1>')).toBe(0);
  });

  it('counts wrong characters', () => {
    expect(calculateErrorCount('abc', 'adc')).toBe(1);
  });

  it('counts missing characters', () => {
    expect(calculateErrorCount('abcd', 'ab')).toBe(2);
  });

  it('counts extra characters', () => {
    expect(calculateErrorCount('ab', 'abcd')).toBe(2);
  });

  it('returns 100 accuracy for exact match', () => {
    expect(calculateAccuracy('hello', 'hello')).toBe(100);
  });

  it('calculates accuracy percentage', () => {
    expect(calculateAccuracy('abcd', 'abxd')).toBe(75);
  });

  it('does not return negative accuracy', () => {
    expect(calculateAccuracy('a', 'bbbb')).toBe(0);
  });

  it('calculates WPM using 5 characters as one word', () => {
    expect(calculateWPM('abcdefghijklmnopqrstuvwxy', 60)).toBe(5);
  });

  it('returns 0 WPM if elapsed time is 0', () => {
    expect(calculateWPM('hello', 0)).toBe(0);
  });

  it('calculates all round metrics together', () => {
    const result = calculateRoundMetrics({
      targetText: 'hello',
      typedText: 'hello',
      startTime: 0,
      endTime: 60000,
    });

    expect(result).toEqual({
      wpm: 1,
      accuracy: 100,
      errorCount: 0,
      elapsedSeconds: 60,
    });
  });
});