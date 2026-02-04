import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import {
  resolveWithinRoot,
  assertWithinRoot,
  isWithinRoot,
  safePath,
} from './paths.js';
import { PathViolationError } from './types.js';

describe('resolveWithinRoot', () => {
  const root = '/home/user/project';

  describe('valid paths', () => {
    it('should resolve relative path within root', () => {
      const result = resolveWithinRoot(root, 'src/lib.rs');
      expect(result).toBe(resolve(root, 'src/lib.rs'));
    });

    it('should resolve nested relative path', () => {
      const result = resolveWithinRoot(root, 'src/nested/deep/file.rs');
      expect(result).toBe(resolve(root, 'src/nested/deep/file.rs'));
    });

    it('should resolve current directory reference', () => {
      const result = resolveWithinRoot(root, './src/lib.rs');
      expect(result).toBe(resolve(root, 'src/lib.rs'));
    });

    it('should handle absolute path within root', () => {
      const absolutePath = resolve(root, 'src/lib.rs');
      const result = resolveWithinRoot(root, absolutePath);
      expect(result).toBe(absolutePath);
    });

    it('should handle empty relative path as root', () => {
      const result = resolveWithinRoot(root, '');
      expect(result).toBe(resolve(root));
    });
  });

  describe('path traversal attacks', () => {
    it('should block simple parent traversal', () => {
      expect(() => resolveWithinRoot(root, '../')).toThrow(PathViolationError);
    });

    it('should block nested parent traversal', () => {
      expect(() => resolveWithinRoot(root, 'src/../../..')).toThrow(PathViolationError);
    });

    it('should block hidden parent traversal', () => {
      expect(() => resolveWithinRoot(root, 'src/../../../etc/passwd')).toThrow(PathViolationError);
    });

    it('should block absolute path outside root', () => {
      expect(() => resolveWithinRoot(root, '/etc/passwd')).toThrow(PathViolationError);
    });

    it('should block root directory access', () => {
      expect(() => resolveWithinRoot(root, '/')).toThrow(PathViolationError);
    });

    it('should block tilde expansion attempt', () => {
      // Note: Node's resolve doesn't expand ~, so this stays within root
      const result = resolveWithinRoot(root, '~/something');
      expect(result).toBe(resolve(root, '~/something'));
    });
  });

  describe('edge cases', () => {
    it('should handle path with spaces', () => {
      const result = resolveWithinRoot(root, 'path with spaces/file.rs');
      expect(result).toBe(resolve(root, 'path with spaces/file.rs'));
    });

    it('should handle path with dots in filename', () => {
      const result = resolveWithinRoot(root, 'src/file.test.rs');
      expect(result).toBe(resolve(root, 'src/file.test.rs'));
    });

    it('should handle path with multiple slashes', () => {
      const result = resolveWithinRoot(root, 'src//lib.rs');
      expect(result).toBe(resolve(root, 'src/lib.rs'));
    });
  });
});

describe('assertWithinRoot', () => {
  const root = '/home/user/project';

  it('should not throw for valid path', () => {
    expect(() => assertWithinRoot(root, resolve(root, 'src/lib.rs'))).not.toThrow();
  });

  it('should throw for path outside root', () => {
    expect(() => assertWithinRoot(root, '/etc/passwd')).toThrow(PathViolationError);
  });

  it('should throw for parent directory', () => {
    expect(() => assertWithinRoot(root, resolve(root, '..'))).toThrow(PathViolationError);
  });
});

describe('isWithinRoot', () => {
  const root = '/home/user/project';

  it('should return true for path within root', () => {
    expect(isWithinRoot(root, resolve(root, 'src/lib.rs'))).toBe(true);
  });

  it('should return false for path outside root', () => {
    expect(isWithinRoot(root, '/etc/passwd')).toBe(false);
  });

  it('should return false for parent traversal', () => {
    expect(isWithinRoot(root, resolve(root, '..'))).toBe(false);
  });

  it('should return true for root itself', () => {
    expect(isWithinRoot(root, root)).toBe(true);
  });
});

describe('safePath', () => {
  const root = '/home/user/project';

  it('should return resolved path for valid segments', () => {
    const result = safePath(root, 'src', 'lib.rs');
    expect(result).toBe(resolve(root, 'src/lib.rs'));
  });

  it('should return null for path escaping root', () => {
    const result = safePath(root, '..', '..', 'etc', 'passwd');
    expect(result).toBeNull();
  });

  it('should handle single segment', () => {
    const result = safePath(root, 'Cargo.toml');
    expect(result).toBe(resolve(root, 'Cargo.toml'));
  });

  it('should handle empty segments', () => {
    const result = safePath(root);
    expect(result).toBe(resolve(root));
  });
});
