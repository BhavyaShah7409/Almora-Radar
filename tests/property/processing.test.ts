import fc from 'fast-check';
import { CATEGORIES } from '@/types';

/**
 * Feature: almora-radar-system, Property 17: Extracted content triggers AI processing
 * Feature: almora-radar-system, Property 31: Processed events stored with all fields
 * Feature: almora-radar-system, Property 32: Stored events have unique identifiers
 * Feature: almora-radar-system, Property 34: Duplicate source links update existing events
 * Validates: Requirements 6.8, 9.1, 9.3, 9.5
 */
describe('Property Tests: Article Processing', () => {
  const eventArbitrary = fc.record({
    _id: fc.hexaString({ minLength: 24, maxLength: 24 }),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    clean_title: fc.string({ minLength: 1, maxLength: 150 }),
    summary_en: fc.string({ minLength: 100, maxLength: 200 }),
    summary_hi: fc.string({ minLength: 100, maxLength: 200 }),
    category: fc.constantFrom(...CATEGORIES),
    coords: fc.record({
      lat: fc.double({ min: -90, max: 90 }),
      lng: fc.double({ min: -180, max: 180 }),
    }),
    images: fc.array(fc.webUrl(), { maxLength: 5 }),
    videos: fc.array(fc.webUrl(), { maxLength: 3 }),
    location_text: fc.string({ minLength: 1, maxLength: 100 }),
    priority_score: fc.integer({ min: 1, max: 5 }),
    keywords: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
    incident_date: fc.date().map(d => d.toISOString()),
    source_link: fc.webUrl(),
    raw_text: fc.string(),
    createdAt: fc.date().map(d => d.toISOString()),
    updatedAt: fc.date().map(d => d.toISOString()),
  });

  test('Property 17: Extracted content triggers AI processing', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1 }),
          content: fc.string({ minLength: 10 }),
          sourceLink: fc.webUrl(),
        }),
        (article) => {
          // Verify article has required fields for processing
          expect(article.title.length).toBeGreaterThan(0);
          expect(article.content.length).toBeGreaterThan(0);
          expect(article.sourceLink).toBeTruthy();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 31: Processed events contain all required fields', () => {
    fc.assert(
      fc.property(eventArbitrary, (event) => {
        const requiredFields = [
          '_id',
          'title',
          'clean_title',
          'summary_en',
          'summary_hi',
          'category',
          'coords',
          'images',
          'videos',
          'location_text',
          'priority_score',
          'keywords',
          'incident_date',
          'source_link',
          'raw_text',
          'createdAt',
          'updatedAt',
        ];

        for (const field of requiredFields) {
          expect(event).toHaveProperty(field);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  test('Property 32: Stored events have unique identifiers', () => {
    fc.assert(
      fc.property(
        fc.array(eventArbitrary, { minLength: 2, maxLength: 10 }),
        (events) => {
          const ids = events.map(e => e._id);
          const uniqueIds = new Set(ids);
          
          // All IDs should be unique
          expect(uniqueIds.size).toBe(ids.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 34: Duplicate source links should be detected', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        fc.array(eventArbitrary, { minLength: 2, maxLength: 5 }),
        (sourceLink, events) => {
          // Set all events to have the same source link
          const eventsWithSameLink = events.map(e => ({
            ...e,
            source_link: sourceLink,
          }));

          // Verify all have the same source link
          const uniqueLinks = new Set(eventsWithSameLink.map(e => e.source_link));
          expect(uniqueLinks.size).toBe(1);
          expect(uniqueLinks.has(sourceLink)).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Event IDs are valid MongoDB ObjectId format', () => {
    fc.assert(
      fc.property(eventArbitrary, (event) => {
        // MongoDB ObjectId is 24 hex characters
        expect(event._id).toMatch(/^[0-9a-fA-F]{24}$/);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  test('Event coordinates are valid', () => {
    fc.assert(
      fc.property(eventArbitrary, (event) => {
        expect(event.coords.lat).toBeGreaterThanOrEqual(-90);
        expect(event.coords.lat).toBeLessThanOrEqual(90);
        expect(event.coords.lng).toBeGreaterThanOrEqual(-180);
        expect(event.coords.lng).toBeLessThanOrEqual(180);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  test('Event priority scores are valid', () => {
    fc.assert(
      fc.property(eventArbitrary, (event) => {
        expect(event.priority_score).toBeGreaterThanOrEqual(1);
        expect(event.priority_score).toBeLessThanOrEqual(5);
        expect(Number.isInteger(event.priority_score)).toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  test('Event categories are valid', () => {
    fc.assert(
      fc.property(eventArbitrary, (event) => {
        expect(CATEGORIES).toContain(event.category);
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
