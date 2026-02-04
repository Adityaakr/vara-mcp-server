import { describe, it, expect } from 'vitest';
import {
  scaffoldProgramSchema,
  compileSchema,
  testSchema,
  clientScaffoldSchema,
  docsSearchSchema,
} from './schemas.js';

describe('scaffoldProgramSchema', () => {
  it('should accept valid input', () => {
    const input = {
      template: 'counter',
      name: 'my-project',
    };
    const result = scaffoldProgramSchema.parse(input);
    expect(result.template).toBe('counter');
    expect(result.name).toBe('my-project');
  });

  it('should apply defaults', () => {
    const input = {
      name: 'my-project',
    };
    const result = scaffoldProgramSchema.parse(input);
    expect(result.template).toBe('counter');
    expect(result.force).toBe(false);
  });

  it('should reject invalid template', () => {
    const input = {
      template: 'invalid',
      name: 'my-project',
    };
    expect(() => scaffoldProgramSchema.parse(input)).toThrow();
  });

  it('should reject invalid project name', () => {
    const input = {
      name: 'Invalid-Name',
    };
    expect(() => scaffoldProgramSchema.parse(input)).toThrow();
  });

  it('should reject empty name', () => {
    const input = {
      name: '',
    };
    expect(() => scaffoldProgramSchema.parse(input)).toThrow();
  });

  it('should accept optional parameters', () => {
    const input = {
      name: 'my-project',
      workspacePath: '/path/to/workspace',
      packageManager: 'pnpm',
      force: true,
    };
    const result = scaffoldProgramSchema.parse(input);
    expect(result.workspacePath).toBe('/path/to/workspace');
    expect(result.packageManager).toBe('pnpm');
    expect(result.force).toBe(true);
  });
});

describe('compileSchema', () => {
  it('should accept empty input with defaults', () => {
    const input = {};
    const result = compileSchema.parse(input);
    expect(result.release).toBe(true);
    expect(result.target).toBe('wasm32-unknown-unknown');
    expect(result.verbose).toBe(false);
  });

  it('should accept all parameters', () => {
    const input = {
      workspacePath: '/path/to/workspace',
      projectPath: 'my-project',
      release: false,
      target: 'wasm32-unknown-unknown',
      verbose: true,
    };
    const result = compileSchema.parse(input);
    expect(result.release).toBe(false);
    expect(result.verbose).toBe(true);
  });
});

describe('testSchema', () => {
  it('should accept empty input with defaults', () => {
    const input = {};
    const result = testSchema.parse(input);
    expect(result.verbose).toBe(false);
  });

  it('should accept filter parameter', () => {
    const input = {
      filter: 'test_counter',
    };
    const result = testSchema.parse(input);
    expect(result.filter).toBe('test_counter');
  });
});

describe('clientScaffoldSchema', () => {
  it('should accept empty input with defaults', () => {
    const input = {};
    const result = clientScaffoldSchema.parse(input);
    expect(result.outDir).toBe('client');
    expect(result.language).toBe('ts');
  });

  it('should accept custom output directory', () => {
    const input = {
      outDir: 'generated-client',
    };
    const result = clientScaffoldSchema.parse(input);
    expect(result.outDir).toBe('generated-client');
  });

  it('should only accept ts language', () => {
    const input = {
      language: 'rust',
    };
    expect(() => clientScaffoldSchema.parse(input)).toThrow();
  });
});

describe('docsSearchSchema', () => {
  it('should accept query', () => {
    const input = {
      query: 'how to build',
    };
    const result = docsSearchSchema.parse(input);
    expect(result.query).toBe('how to build');
  });

  it('should apply default maxResults', () => {
    const input = {
      query: 'test',
    };
    const result = docsSearchSchema.parse(input);
    expect(result.maxResults).toBe(5);
  });

  it('should reject empty query', () => {
    const input = {
      query: '',
    };
    expect(() => docsSearchSchema.parse(input)).toThrow();
  });

  it('should reject maxResults out of range', () => {
    expect(() => docsSearchSchema.parse({ query: 'test', maxResults: 0 })).toThrow();
    expect(() => docsSearchSchema.parse({ query: 'test', maxResults: 21 })).toThrow();
  });

  it('should accept maxResults in range', () => {
    const result = docsSearchSchema.parse({ query: 'test', maxResults: 10 });
    expect(result.maxResults).toBe(10);
  });
});
