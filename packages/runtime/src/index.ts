// Types
export type { ExecResult, SafeSpawnOptions, AllowedCommand } from './types.js';
export { SecurityError, PathViolationError, CommandNotAllowedError } from './types.js';

// Execution utilities
export { safeSpawn, validateCommand, commandExists, ALLOWED_COMMANDS } from './exec.js';

// Path utilities
export {
  resolveWithinRoot,
  assertWithinRoot,
  isWithinRoot,
  ensureDirectoryWithinRoot,
  safePath,
  joinSafe,
} from './paths.js';

// Logging
export { logger, createLogger } from './logger.js';
export type { LogLevel, LoggerConfig } from './logger.js';

// Which utility
export { which } from './which.js';
