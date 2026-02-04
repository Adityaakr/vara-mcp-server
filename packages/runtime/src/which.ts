import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Find the full path to a command
 * Cross-platform implementation that doesn't rely on shell
 */
export async function which(command: string): Promise<string | null> {
  // If it's an absolute path and exists, use it
  if (command.startsWith('/') || command.startsWith('\\')) {
    if (existsSync(command) && isExecutable(command)) {
      return command;
    }
    return null;
  }

  // Get PATH environment variable
  const pathEnv = process.env.PATH || '';
  const pathSeparator = process.platform === 'win32' ? ';' : ':';
  const paths = pathEnv.split(pathSeparator);

  // Extensions to check on Windows
  const extensions = process.platform === 'win32' 
    ? ['', '.exe', '.cmd', '.bat', '.com']
    : [''];

  for (const dir of paths) {
    for (const ext of extensions) {
      const fullPath = join(dir, command + ext);
      try {
        if (existsSync(fullPath) && isExecutable(fullPath)) {
          return fullPath;
        }
      } catch {
        // Skip paths we can't access
      }
    }
  }

  return null;
}

/**
 * Check if a file is executable
 */
function isExecutable(filepath: string): boolean {
  try {
    const stats = statSync(filepath);
    if (!stats.isFile()) {
      return false;
    }
    
    // On Windows, we just check if the file exists with expected extensions
    if (process.platform === 'win32') {
      return true;
    }

    // On Unix, check execute permission
    const mode = stats.mode;
    const isOwner = stats.uid === process.getuid?.();
    const isGroup = stats.gid === process.getgid?.();

    if (isOwner && (mode & 0o100)) return true;
    if (isGroup && (mode & 0o010)) return true;
    if (mode & 0o001) return true;

    return false;
  } catch {
    return false;
  }
}
