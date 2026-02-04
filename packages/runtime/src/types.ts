/**
 * Result of a command execution
 */
export interface ExecResult {
  /** Exit code from the process */
  code: number;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Whether the command succeeded (code === 0) */
  success: boolean;
}

/**
 * Options for safe spawn
 */
export interface SafeSpawnOptions {
  /** Working directory for the command */
  cwd?: string;
  /** Environment variables (merged with process.env) */
  env?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Maximum buffer size for stdout/stderr */
  maxBuffer?: number;
}

/**
 * Allowed command configuration
 */
export interface AllowedCommand {
  /** The command binary name */
  command: string;
  /** Allowed subcommands (if applicable) */
  allowedSubcommands?: string[];
  /** Whether to require subcommand validation */
  requireSubcommand?: boolean;
}

/**
 * Security violation error
 */
export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Path violation error
 */
export class PathViolationError extends SecurityError {
  constructor(
    public readonly requestedPath: string,
    public readonly rootPath: string
  ) {
    super(`Path "${requestedPath}" is outside allowed root "${rootPath}"`);
    this.name = 'PathViolationError';
  }
}

/**
 * Command not allowed error
 */
export class CommandNotAllowedError extends SecurityError {
  constructor(
    public readonly command: string,
    public readonly args: string[]
  ) {
    super(`Command not allowed: ${command} ${args.join(' ')}`);
    this.name = 'CommandNotAllowedError';
  }
}
