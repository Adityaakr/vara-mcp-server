import { resolve, relative, normalize, isAbsolute } from 'node:path';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { PathViolationError } from './types.js';

/**
 * Resolve a path and ensure it's within the allowed root
 * 
 * @param root - The root directory that acts as the sandbox
 * @param inputPath - The path to resolve (can be relative or absolute)
 * @returns The resolved absolute path
 * @throws PathViolationError if the path escapes the root
 */
export function resolveWithinRoot(root: string, inputPath: string): string {
  // Normalize and resolve the root to an absolute path
  const normalizedRoot = resolve(normalize(root));
  
  // Resolve the input path
  let resolvedPath: string;
  if (isAbsolute(inputPath)) {
    resolvedPath = normalize(inputPath);
  } else {
    resolvedPath = resolve(normalizedRoot, normalize(inputPath));
  }

  // Check that the resolved path is within the root
  assertWithinRoot(normalizedRoot, resolvedPath);

  return resolvedPath;
}

/**
 * Assert that a path is within the allowed root directory
 * 
 * @param root - The root directory that acts as the sandbox
 * @param targetPath - The path to check (should be absolute)
 * @throws PathViolationError if the path is outside the root
 */
export function assertWithinRoot(root: string, targetPath: string): void {
  const normalizedRoot = resolve(normalize(root));
  const normalizedTarget = resolve(normalize(targetPath));

  // Get relative path from root to target
  const relativePath = relative(normalizedRoot, normalizedTarget);

  // Check for escaping patterns
  if (
    relativePath.startsWith('..') ||
    relativePath.startsWith('/') ||
    isAbsolute(relativePath)
  ) {
    throw new PathViolationError(targetPath, root);
  }

  // Additional check: ensure target starts with root
  if (!normalizedTarget.startsWith(normalizedRoot)) {
    throw new PathViolationError(targetPath, root);
  }
}

/**
 * Check if a path is within the allowed root without throwing
 */
export function isWithinRoot(root: string, targetPath: string): boolean {
  try {
    assertWithinRoot(root, targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure a directory exists within the allowed root
 * Creates the directory if it doesn't exist
 */
export function ensureDirectoryWithinRoot(root: string, dirPath: string): string {
  const resolvedPath = resolveWithinRoot(root, dirPath);
  
  if (!existsSync(resolvedPath)) {
    mkdirSync(resolvedPath, { recursive: true });
  } else {
    const stats = statSync(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path exists but is not a directory: ${resolvedPath}`);
    }
  }

  return resolvedPath;
}

/**
 * Get a safe path for a new file/directory within the root
 * Returns null if the path would escape the root
 */
export function safePath(root: string, ...segments: string[]): string | null {
  try {
    const combined = segments.join('/');
    return resolveWithinRoot(root, combined);
  } catch {
    return null;
  }
}

/**
 * Normalize path segments and join them safely
 */
export function joinSafe(...segments: string[]): string {
  return normalize(segments.join('/'));
}
