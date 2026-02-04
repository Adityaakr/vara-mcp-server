import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { which } from './which.js';
import { logger } from './logger.js';
import type { ExecResult, SafeSpawnOptions, AllowedCommand } from './types.js';
import { CommandNotAllowedError, SecurityError } from './types.js';

/**
 * Command allowlist with specific subcommand restrictions
 * This is the security boundary - only these commands can be executed
 */
export const ALLOWED_COMMANDS: AllowedCommand[] = [
  {
    command: 'cargo',
    allowedSubcommands: ['build', 'test', 'check', 'sails', 'clean', 'fmt', 'clippy'],
    requireSubcommand: true,
  },
  {
    command: 'node',
    requireSubcommand: false,
  },
  {
    command: 'npm',
    allowedSubcommands: ['init', 'install', 'run', 'test', 'pack'],
    requireSubcommand: true,
  },
  {
    command: 'pnpm',
    allowedSubcommands: ['init', 'install', 'add', 'run', 'test', 'pack'],
    requireSubcommand: true,
  },
  {
    command: 'yarn',
    allowedSubcommands: ['init', 'install', 'add', 'run', 'test', 'pack'],
    requireSubcommand: true,
  },
  {
    command: 'rustup',
    allowedSubcommands: ['target', 'show', 'update'],
    requireSubcommand: true,
  },
];

/**
 * Dangerous patterns that should never appear in arguments
 */
const DANGEROUS_PATTERNS = [
  /[;&|`$]/,      // Shell metacharacters
  /\$\(/,         // Command substitution
  /`/,            // Backtick command substitution
  /\.\.[/\\]/,    // Parent directory traversal (checked more thoroughly in paths.ts)
  />\s*\//,       // Redirect to root
  /<\s*\//,       // Read from root
];

/**
 * Validate that a command and its arguments are allowed
 */
export function validateCommand(command: string, args: string[]): void {
  // Find the allowed command configuration
  const allowedConfig = ALLOWED_COMMANDS.find((c) => c.command === command);

  if (!allowedConfig) {
    throw new CommandNotAllowedError(command, args);
  }

  // Check subcommand if required
  if (allowedConfig.requireSubcommand && allowedConfig.allowedSubcommands) {
    const subcommand = args[0];
    if (!subcommand || !allowedConfig.allowedSubcommands.includes(subcommand)) {
      throw new CommandNotAllowedError(
        command,
        args
      );
    }
  }

  // Check all arguments for dangerous patterns
  for (const arg of args) {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(arg)) {
        throw new SecurityError(`Argument contains dangerous pattern: "${arg}"`);
      }
    }
  }
}

/**
 * Execute a command safely with allowlist validation
 * 
 * SECURITY: This function NEVER uses shell execution.
 * It spawns processes directly with an args array.
 */
export async function safeSpawn(
  command: string,
  args: string[],
  options: SafeSpawnOptions = {}
): Promise<ExecResult> {
  // Validate command against allowlist
  validateCommand(command, args);

  const {
    cwd = process.cwd(),
    env = {},
    timeout = 300000, // 5 minutes default
    maxBuffer = 10 * 1024 * 1024, // 10MB default
  } = options;

  // Resolve the full command path
  const commandPath = await which(command);
  if (!commandPath) {
    return {
      code: 127,
      stdout: '',
      stderr: `Command not found: ${command}`,
      success: false,
    };
  }

  // Validate cwd exists
  if (!existsSync(cwd)) {
    return {
      code: 1,
      stdout: '',
      stderr: `Working directory does not exist: ${cwd}`,
      success: false,
    };
  }

  logger.debug(`Executing: ${command} ${args.join(' ')}`, { cwd });

  return new Promise((resolve) => {
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutSize = 0;
    let stderrSize = 0;
    let timedOut = false;

    // SECURITY: shell: false ensures no shell interpretation
    const child = spawn(commandPath, args, {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }, timeout);

    child.stdout?.on('data', (chunk: Buffer) => {
      if (stdoutSize + chunk.length <= maxBuffer) {
        stdoutChunks.push(chunk);
        stdoutSize += chunk.length;
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      if (stderrSize + chunk.length <= maxBuffer) {
        stderrChunks.push(chunk);
        stderrSize += chunk.length;
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);

      const stdout = Buffer.concat(stdoutChunks).toString('utf-8');
      const stderr = Buffer.concat(stderrChunks).toString('utf-8');
      const exitCode = code ?? (timedOut ? 124 : 1);

      if (timedOut) {
        resolve({
          code: 124,
          stdout,
          stderr: stderr + '\nProcess timed out',
          success: false,
        });
      } else {
        resolve({
          code: exitCode,
          stdout,
          stderr,
          success: exitCode === 0,
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeoutId);
      resolve({
        code: 1,
        stdout: '',
        stderr: err.message,
        success: false,
      });
    });
  });
}

/**
 * Check if a command exists on the system
 */
export async function commandExists(command: string): Promise<boolean> {
  const path = await which(command);
  return path !== null;
}
