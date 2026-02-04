/**
 * Log levels for the logger
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  prefix: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Simple structured logger that writes to stderr
 * 
 * IMPORTANT: MCP servers must use stderr for logging to keep
 * the stdout channel clean for the STDIO protocol
 */
class Logger {
  private config: LoggerConfig = {
    level: 'info',
    prefix: '[vara-mcp]',
  };

  /**
   * Configure the logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Check if a log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  /**
   * Format a log message
   */
  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix;
    const levelStr = level.toUpperCase().padEnd(5);
    
    let formatted = `${timestamp} ${prefix} ${levelStr} ${message}`;
    
    if (data !== undefined) {
      try {
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        formatted += `\n${dataStr}`;
      } catch {
        formatted += '\n[unserializable data]';
      }
    }
    
    return formatted;
  }

  /**
   * Write a log message to stderr
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const formatted = this.formatMessage(level, message, data);
    
    // CRITICAL: Always write to stderr, never stdout
    // stdout is reserved for the MCP STDIO protocol
    process.stderr.write(formatted + '\n');
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Create a child logger with a specific prefix
 */
export function createLogger(prefix: string): Logger {
  const childLogger = new Logger();
  childLogger.configure({ prefix: `[vara-mcp:${prefix}]` });
  return childLogger;
}
