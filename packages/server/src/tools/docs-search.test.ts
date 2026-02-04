import { describe, it, expect } from 'vitest';
import { searchDocs } from './docs-search.js';

describe('searchDocs', () => {
  describe('basic search', () => {
    it('should find quickstart documentation', () => {
      const result = searchDocs({ query: 'quickstart', maxResults: 5 });
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.some(r => r.title.toLowerCase().includes('quickstart') || r.section.toLowerCase().includes('quickstart'))).toBe(true);
    });

    it('should find build-related documentation', () => {
      const result = searchDocs({ query: 'build wasm', maxResults: 5 });
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should find service-related documentation', () => {
      const result = searchDocs({ query: 'service definition', maxResults: 5 });
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should find gear-js documentation', () => {
      const result = searchDocs({ query: 'connect node', maxResults: 5 });
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  describe('result structure', () => {
    it('should return proper result structure', () => {
      const result = searchDocs({ query: 'sails', maxResults: 5 });
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('totalFound');
      
      if (result.results.length > 0) {
        const firstResult = result.results[0];
        expect(firstResult).toHaveProperty('title');
        expect(firstResult).toHaveProperty('section');
        expect(firstResult).toHaveProperty('snippet');
        expect(firstResult).toHaveProperty('relevance');
      }
    });

    it('should respect maxResults limit', () => {
      const result = searchDocs({ query: 'program', maxResults: 2 });
      expect(result.results.length).toBeLessThanOrEqual(2);
    });

    it('should return relevance between 0 and 1', () => {
      const result = searchDocs({ query: 'cargo build', maxResults: 5 });
      for (const r of result.results) {
        expect(r.relevance).toBeGreaterThanOrEqual(0);
        expect(r.relevance).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('no results', () => {
    it('should return empty results for nonsense query', () => {
      const result = searchDocs({ query: 'xyzabc123nonsense', maxResults: 5 });
      expect(result.results.length).toBe(0);
      expect(result.totalFound).toBe(0);
    });
  });

  describe('relevance ranking', () => {
    it('should rank title matches higher', () => {
      const result = searchDocs({ query: 'quickstart', maxResults: 5 });
      // First result should be highly relevant
      if (result.results.length > 0) {
        expect(result.results[0].relevance).toBeGreaterThan(0.3);
      }
    });

    it('should rank keyword matches appropriately', () => {
      const result = searchDocs({ query: 'upload deploy program', maxResults: 5 });
      expect(result.results.length).toBeGreaterThan(0);
      // Results should be sorted by relevance (descending)
      for (let i = 1; i < result.results.length; i++) {
        expect(result.results[i - 1].relevance).toBeGreaterThanOrEqual(result.results[i].relevance);
      }
    });
  });

  describe('snippet extraction', () => {
    it('should include snippet with search terms', () => {
      const result = searchDocs({ query: 'cargo build', maxResults: 5 });
      expect(result.results.length).toBeGreaterThan(0);
      
      // At least one result should have a snippet containing search terms
      const hasRelevantSnippet = result.results.some(r => 
        r.snippet.toLowerCase().includes('cargo') || 
        r.snippet.toLowerCase().includes('build')
      );
      expect(hasRelevantSnippet).toBe(true);
    });

    it('should limit snippet length', () => {
      const result = searchDocs({ query: 'program', maxResults: 5 });
      for (const r of result.results) {
        expect(r.snippet.length).toBeLessThanOrEqual(350); // 300 + buffer for "..."
      }
    });
  });
});
