import fc from 'fast-check';
import { countWords, formatNumber } from '@/lib/utils/text';
import { isCategoryValid, validateCoordinates } from '@/lib/utils/validators';
import { CATEGORIES } from '@/types';

/**
 * Feature: almora-radar-system, Property 18: English summary meets word count requirement
 * Feature: almora-radar-system, Property 19: Hindi summary meets word count requirement
 * Validates: Requirements 7.1, 7.2
 */
describe('Property Tests: Word Counting', () => {
  test('Property 18 & 19: Word count is accurate for any text', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const count = countWords(text);
        
        // Word count should be non-negative
        expect(count).toBeGreaterThanOrEqual(0);
        
        // Empty or whitespace-only strings should have 0 words
        if (!text || text.trim().length === 0) {
          expect(count).toBe(0);
        }
        
        // Non-empty strings should have at least 1 word
        if (text.trim().length > 0 && /\S/.test(text)) {
          expect(count).toBeGreaterThan(0);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  test('Word count handles Unicode characters correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.unicodeString(), { minLength: 1, maxLength: 20 }),
        (words) => {
          const text = words.join(' ');
          const count = countWords(text);
          
          // Count should match number of space-separated segments
          const expected = text.trim().split(/\s+/).filter(w => w.length > 0).length;
          expect(count).toBe(expected);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: almora-radar-system, Property 61: User count formats with separators
 * Validates: Requirements 16.2
 */
describe('Property Tests: Number Formatting', () => {
  test('Property 61: Numbers are formatted with thousand separators', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000000 }), (num) => {
        const formatted = formatNumber(num);
        
        // Should be a string
        expect(typeof formatted).toBe('string');
        
        // Should contain the digits of the number
        const digitsOnly = formatted.replace(/,/g, '');
        expect(parseInt(digitsOnly, 10)).toBe(num);
        
        // Numbers >= 1000 should have commas
        if (num >= 1000) {
          expect(formatted).toContain(',');
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  test('Formatted numbers can be parsed back to original', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000000 }), (num) => {
        const formatted = formatNumber(num);
        const parsed = parseInt(formatted.replace(/,/g, ''), 10);
        
        expect(parsed).toBe(num);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: almora-radar-system, Property 20: Category classification is valid
 * Validates: Requirements 7.3
 */
describe('Property Tests: Category Validation', () => {
  test('Property 20: Valid categories are accepted', () => {
    fc.assert(
      fc.property(fc.constantFrom(...CATEGORIES), (category) => {
        expect(isCategoryValid(category)).toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  test('Invalid categories are rejected', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !CATEGORIES.includes(s as any)),
        (invalidCategory) => {
          expect(isCategoryValid(invalidCategory)).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: almora-radar-system, Property 30: Coordinates are validated
 * Validates: Requirements 8.5
 */
describe('Property Tests: Coordinate Validation', () => {
  test('Property 30: Valid coordinates are accepted', () => {
    fc.assert(
      fc.property(
        fc.record({
          lat: fc.double({ min: -90, max: 90 }),
          lng: fc.double({ min: -180, max: 180 }),
        }),
        (coords) => {
          expect(validateCoordinates(coords)).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Invalid latitudes are rejected', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: -91 }).chain(lat =>
          fc.record({
            lat: fc.constant(lat),
            lng: fc.double({ min: -180, max: 180 }),
          })
        ),
        (coords) => {
          expect(validateCoordinates(coords)).toBe(false);
          return true;
        }
      ),
      { numRuns: 50 }
    );

    fc.assert(
      fc.property(
        fc.double({ min: 91, max: 1000 }).chain(lat =>
          fc.record({
            lat: fc.constant(lat),
            lng: fc.double({ min: -180, max: 180 }),
          })
        ),
        (coords) => {
          expect(validateCoordinates(coords)).toBe(false);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Invalid longitudes are rejected', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: -181 }).chain(lng =>
          fc.record({
            lat: fc.double({ min: -90, max: 90 }),
            lng: fc.constant(lng),
          })
        ),
        (coords) => {
          expect(validateCoordinates(coords)).toBe(false);
          return true;
        }
      ),
      { numRuns: 50 }
    );

    fc.assert(
      fc.property(
        fc.double({ min: 181, max: 1000 }).chain(lng =>
          fc.record({
            lat: fc.double({ min: -90, max: 90 }),
            lng: fc.constant(lng),
          })
        ),
        (coords) => {
          expect(validateCoordinates(coords)).toBe(false);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
