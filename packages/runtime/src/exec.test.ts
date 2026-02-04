import { describe, it, expect } from 'vitest';
import { validateCommand, ALLOWED_COMMANDS } from './exec.js';
import { CommandNotAllowedError, SecurityError } from './types.js';

describe('validateCommand', () => {
  describe('allowed commands', () => {
    it('should allow cargo build', () => {
      expect(() => validateCommand('cargo', ['build'])).not.toThrow();
    });

    it('should allow cargo test', () => {
      expect(() => validateCommand('cargo', ['test'])).not.toThrow();
    });

    it('should allow cargo build with flags', () => {
      expect(() => validateCommand('cargo', ['build', '--release', '--target', 'wasm32-unknown-unknown'])).not.toThrow();
    });

    it('should allow node', () => {
      expect(() => validateCommand('node', ['script.js'])).not.toThrow();
    });

    it('should allow npm install', () => {
      expect(() => validateCommand('npm', ['install'])).not.toThrow();
    });

    it('should allow pnpm install', () => {
      expect(() => validateCommand('pnpm', ['install'])).not.toThrow();
    });

    it('should allow rustup target add', () => {
      expect(() => validateCommand('rustup', ['target', 'add', 'wasm32-unknown-unknown'])).not.toThrow();
    });
  });

  describe('blocked commands', () => {
    it('should block rm command', () => {
      expect(() => validateCommand('rm', ['-rf', '/'])).toThrow(CommandNotAllowedError);
    });

    it('should block sh command', () => {
      expect(() => validateCommand('sh', ['-c', 'echo hello'])).toThrow(CommandNotAllowedError);
    });

    it('should block bash command', () => {
      expect(() => validateCommand('bash', ['-c', 'echo hello'])).toThrow(CommandNotAllowedError);
    });

    it('should block curl command', () => {
      expect(() => validateCommand('curl', ['http://example.com'])).toThrow(CommandNotAllowedError);
    });

    it('should block wget command', () => {
      expect(() => validateCommand('wget', ['http://example.com'])).toThrow(CommandNotAllowedError);
    });
  });

  describe('blocked subcommands', () => {
    it('should block cargo with disallowed subcommand', () => {
      expect(() => validateCommand('cargo', ['publish'])).toThrow(CommandNotAllowedError);
    });

    it('should block npm with dangerous subcommand', () => {
      expect(() => validateCommand('npm', ['exec', 'malicious'])).toThrow(CommandNotAllowedError);
    });

    it('should block rustup with dangerous subcommand', () => {
      expect(() => validateCommand('rustup', ['self', 'uninstall'])).toThrow(CommandNotAllowedError);
    });
  });

  describe('dangerous patterns in arguments', () => {
    it('should block semicolon injection', () => {
      expect(() => validateCommand('cargo', ['build', '; rm -rf /'])).toThrow(SecurityError);
    });

    it('should block ampersand injection', () => {
      expect(() => validateCommand('cargo', ['build', '& echo pwned'])).toThrow(SecurityError);
    });

    it('should block pipe injection', () => {
      expect(() => validateCommand('cargo', ['build', '| cat /etc/passwd'])).toThrow(SecurityError);
    });

    it('should block backtick command substitution', () => {
      expect(() => validateCommand('cargo', ['build', '`whoami`'])).toThrow(SecurityError);
    });

    it('should block dollar command substitution', () => {
      expect(() => validateCommand('cargo', ['build', '$(whoami)'])).toThrow(SecurityError);
    });

    it('should block parent directory traversal', () => {
      expect(() => validateCommand('cargo', ['build', '--manifest-path', '../../../etc/passwd'])).toThrow(SecurityError);
    });
  });

  describe('allowed patterns', () => {
    it('should allow normal file paths', () => {
      expect(() => validateCommand('cargo', ['build', '--manifest-path', './subdir/Cargo.toml'])).not.toThrow();
    });

    it('should allow flags with values', () => {
      expect(() => validateCommand('cargo', ['build', '--target', 'wasm32-unknown-unknown', '-j', '4'])).not.toThrow();
    });

    it('should allow environment-like strings without actual injection', () => {
      expect(() => validateCommand('node', ['--version'])).not.toThrow();
    });
  });
});

describe('ALLOWED_COMMANDS', () => {
  it('should have cargo in allowlist', () => {
    const cargo = ALLOWED_COMMANDS.find(c => c.command === 'cargo');
    expect(cargo).toBeDefined();
    expect(cargo?.allowedSubcommands).toContain('build');
    expect(cargo?.allowedSubcommands).toContain('test');
  });

  it('should have node in allowlist', () => {
    const node = ALLOWED_COMMANDS.find(c => c.command === 'node');
    expect(node).toBeDefined();
  });

  it('should not have dangerous commands', () => {
    const dangerous = ['rm', 'sh', 'bash', 'curl', 'wget', 'cat', 'chmod'];
    for (const cmd of dangerous) {
      const found = ALLOWED_COMMANDS.find(c => c.command === cmd);
      expect(found).toBeUndefined();
    }
  });
});
