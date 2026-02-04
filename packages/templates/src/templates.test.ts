import { describe, it, expect } from 'vitest';
import {
  getAvailableTemplates,
  getTemplateInfo,
  validateProjectName,
  TEMPLATES,
} from './templates.js';

describe('getAvailableTemplates', () => {
  it('should return an array of template names', () => {
    const templates = getAvailableTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should include counter template', () => {
    const templates = getAvailableTemplates();
    expect(templates).toContain('counter');
  });
});

describe('getTemplateInfo', () => {
  it('should return info for counter template', () => {
    const info = getTemplateInfo('counter');
    expect(info).toBeDefined();
    expect(info?.name).toBe('counter');
    expect(info?.displayName).toBe('Counter Program');
  });

  it('should include file list', () => {
    const info = getTemplateInfo('counter');
    expect(info?.files).toBeDefined();
    expect(info?.files).toContain('Cargo.toml');
    expect(info?.files).toContain('src/lib.rs');
  });

  it('should include placeholders', () => {
    const info = getTemplateInfo('counter');
    expect(info?.placeholders).toBeDefined();
    expect(info?.placeholders).toContain('PROJECT_NAME');
  });
});

describe('validateProjectName', () => {
  describe('valid names', () => {
    it('should accept lowercase name', () => {
      const result = validateProjectName('myproject');
      expect(result.valid).toBe(true);
    });

    it('should accept name with numbers', () => {
      const result = validateProjectName('project123');
      expect(result.valid).toBe(true);
    });

    it('should accept name with underscores', () => {
      const result = validateProjectName('my_project');
      expect(result.valid).toBe(true);
    });

    it('should accept name with hyphens', () => {
      const result = validateProjectName('my-project');
      expect(result.valid).toBe(true);
    });

    it('should accept single character name', () => {
      const result = validateProjectName('a');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid names', () => {
    it('should reject empty name', () => {
      const result = validateProjectName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject name starting with number', () => {
      const result = validateProjectName('123project');
      expect(result.valid).toBe(false);
    });

    it('should reject name with uppercase', () => {
      const result = validateProjectName('MyProject');
      expect(result.valid).toBe(false);
    });

    it('should reject name with spaces', () => {
      const result = validateProjectName('my project');
      expect(result.valid).toBe(false);
    });

    it('should reject name with special characters', () => {
      const result = validateProjectName('my@project');
      expect(result.valid).toBe(false);
    });

    it('should reject Rust keywords', () => {
      const keywords = ['fn', 'let', 'mut', 'pub', 'struct', 'impl', 'trait', 'self'];
      for (const keyword of keywords) {
        const result = validateProjectName(keyword);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('reserved');
      }
    });
  });
});

describe('TEMPLATES constant', () => {
  it('should have counter template defined', () => {
    expect(TEMPLATES.counter).toBeDefined();
  });

  it('should have proper structure', () => {
    for (const [name, template] of Object.entries(TEMPLATES)) {
      expect(template.name).toBe(name);
      expect(template.displayName).toBeDefined();
      expect(template.description).toBeDefined();
      expect(Array.isArray(template.files)).toBe(true);
      expect(Array.isArray(template.placeholders)).toBe(true);
    }
  });
});
