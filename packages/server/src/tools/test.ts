import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { safeSpawn, resolveWithinRoot, logger, commandExists } from '@vara-mcp/runtime';
import type { TestInput } from './schemas.js';

export interface TestResult {
  success: boolean;
  passed: number;
  failed: number;
  ignored: number;
  stdout: string;
  stderr: string;
  summary: string;
  error?: string;
}

/**
 * Run tests for a Vara program
 */
export async function testProgram(
  input: TestInput,
  workspaceRoot: string
): Promise<TestResult> {
  const { workspacePath, projectPath, verbose, filter } = input;

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
      passed: 0,
      failed: 0,
      ignored: 0,
      stdout: '',
      stderr: '',
      summary: 'No Cargo.toml found',
      error: `No Cargo.toml found at: ${effectiveProjectPath}`,
    };
  }

  // Check if cargo is available
  const cargoExists = await commandExists('cargo');
  if (!cargoExists) {
    return {
      success: false,
      passed: 0,
      failed: 0,
      ignored: 0,
      stdout: '',
      stderr: '',
      summary: 'cargo not found',
      error: 'cargo not found in PATH. Please install Rust: https://rustup.rs/',
    };
  }

  // Build arguments
  const args = ['test'];
  if (verbose) {
    args.push('-v');
  }
  if (filter) {
    args.push(filter);
  }
  // Always show output for test runs
  args.push('--', '--nocapture');

  logger.info(`Testing: cargo ${args.join(' ')}`);

  // Run cargo test
  const result = await safeSpawn('cargo', args, {
    cwd: effectiveProjectPath,
    timeout: 600000, // 10 minutes for tests
  });

  // Parse test results from output
  const { passed, failed, ignored } = parseTestOutput(result.stdout + result.stderr);

  const summary = formatTestSummary(passed, failed, ignored, result.success);

  return {
    success: result.success,
    passed,
    failed,
    ignored,
    stdout: result.stdout,
    stderr: result.stderr,
    summary,
    error: result.success ? undefined : `Tests failed with exit code ${result.code}`,
  };
}

/**
 * Parse test counts from cargo test output
 */
function parseTestOutput(output: string): { passed: number; failed: number; ignored: number } {
  let passed = 0;
  let failed = 0;
  let ignored = 0;

  // Look for summary line like: "test result: ok. 5 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out"
  const summaryMatch = output.match(
    /test result:.*?(\d+)\s+passed.*?(\d+)\s+failed.*?(\d+)\s+ignored/
  );

  if (summaryMatch) {
    passed = parseInt(summaryMatch[1], 10);
    failed = parseInt(summaryMatch[2], 10);
    ignored = parseInt(summaryMatch[3], 10);
  } else {
    // Count individual test results
    const passedMatches = output.match(/test\s+\S+\s+\.\.\.\s+ok/g);
    const failedMatches = output.match(/test\s+\S+\s+\.\.\.\s+FAILED/g);
    const ignoredMatches = output.match(/test\s+\S+\s+\.\.\.\s+ignored/g);

    passed = passedMatches?.length ?? 0;
    failed = failedMatches?.length ?? 0;
    ignored = ignoredMatches?.length ?? 0;
  }

  return { passed, failed, ignored };
}

/**
 * Format a human-readable test summary
 */
function formatTestSummary(
  passed: number,
  failed: number,
  ignored: number,
  success: boolean
): string {
  const total = passed + failed + ignored;
  const status = success ? 'PASSED' : 'FAILED';
  
  const parts = [
    `${status}: ${total} test(s)`,
    `${passed} passed`,
  ];

  if (failed > 0) {
    parts.push(`${failed} failed`);
  }
  if (ignored > 0) {
    parts.push(`${ignored} ignored`);
  }

  return parts.join(', ');
}
