import { existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { safeSpawn, resolveWithinRoot, logger, commandExists } from '@vara-mcp/runtime';
import type { CompileInput } from './schemas.js';

export interface CompileResult {
  success: boolean;
  wasmPaths: string[];
  idlPaths: string[];
  stdout: string;
  stderr: string;
  error?: string;
}

/**
 * Compile a Vara program
 */
export async function compileProgram(
  input: CompileInput,
  workspaceRoot: string
): Promise<CompileResult> {
  const { workspacePath, projectPath, release, target, verbose } = input;

  // Resolve paths
  const effectiveWorkspace = workspacePath
    ? resolveWithinRoot(workspaceRoot, workspacePath)
    : workspaceRoot;

  const effectiveProjectPath = projectPath
    ? resolveWithinRoot(effectiveWorkspace, projectPath)
    : effectiveWorkspace;

  // Check if project exists
  const cargoToml = join(effectiveProjectPath, 'Cargo.toml');
  if (!existsSync(cargoToml)) {
    return {
      success: false,
      wasmPaths: [],
      idlPaths: [],
      stdout: '',
      stderr: '',
      error: `No Cargo.toml found at: ${effectiveProjectPath}`,
    };
  }

  // Check if cargo is available
  const cargoExists = await commandExists('cargo');
  if (!cargoExists) {
    return {
      success: false,
      wasmPaths: [],
      idlPaths: [],
      stdout: '',
      stderr: '',
      error: 'cargo not found in PATH. Please install Rust: https://rustup.rs/',
    };
  }

  // Check if target is installed
  const targetCheck = await checkRustTarget(target);
  if (!targetCheck.installed) {
    return {
      success: false,
      wasmPaths: [],
      idlPaths: [],
      stdout: '',
      stderr: '',
      error: `Rust target "${target}" is not installed. Run: rustup target add ${target}`,
    };
  }

  // Build arguments
  const args = ['build'];
  if (release) {
    args.push('--release');
  }
  args.push('--target', target);
  if (verbose) {
    args.push('-v');
  }

  logger.info(`Compiling: cargo ${args.join(' ')}`);

  // Run cargo build
  const result = await safeSpawn('cargo', args, {
    cwd: effectiveProjectPath,
    timeout: 600000, // 10 minutes for compilation
  });

  if (!result.success) {
    return {
      success: false,
      wasmPaths: [],
      idlPaths: [],
      stdout: result.stdout,
      stderr: result.stderr,
      error: `Compilation failed with exit code ${result.code}`,
    };
  }

  // Find output files
  const profile = release ? 'release' : 'debug';
  const targetDir = join(effectiveProjectPath, 'target', target, profile);

  const wasmPaths: string[] = [];
  const idlPaths: string[] = [];

  if (existsSync(targetDir)) {
    const files = readdirSync(targetDir);
    for (const file of files) {
      if (file.endsWith('.wasm') || file.endsWith('.opt.wasm')) {
        wasmPaths.push(join(targetDir, file));
      }
      if (file.endsWith('.idl')) {
        idlPaths.push(join(targetDir, file));
      }
    }
  }

  return {
    success: true,
    wasmPaths,
    idlPaths,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

/**
 * Check if a Rust target is installed
 */
async function checkRustTarget(target: string): Promise<{ installed: boolean }> {
  const result = await safeSpawn('rustup', ['target', 'list', '--installed']);
  if (!result.success) {
    // If rustup isn't available, assume target is installed
    return { installed: true };
  }

  const installedTargets = result.stdout.split('\n').map((t) => t.trim());
  return { installed: installedTargets.includes(target) };
}
