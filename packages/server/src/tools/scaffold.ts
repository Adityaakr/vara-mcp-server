import { existsSync, rmSync } from 'node:fs';
import {
  safeSpawn,
  commandExists,
  resolveWithinRoot,
  logger,
} from '@vara-mcp/runtime';
import {
  scaffoldFromTemplate,
  validateProjectName,
  type TemplateName,
} from '@vara-mcp/templates';
import type { ScaffoldProgramInput } from './schemas.js';

export interface ScaffoldResult {
  success: boolean;
  projectPath: string;
  method: 'sails-cli' | 'embedded-template';
  createdFiles: string[];
  nextSteps: string[];
  error?: string;
}

/**
 * Scaffold a new Vara program
 * 
 * Prefers Sails CLI if available, falls back to embedded templates.
 */
export async function scaffoldProgram(
  input: ScaffoldProgramInput,
  workspaceRoot: string
): Promise<ScaffoldResult> {
  const { template, name, workspacePath, force } = input;

  // Resolve workspace path
  const effectiveWorkspace = workspacePath
    ? resolveWithinRoot(workspaceRoot, workspacePath)
    : workspaceRoot;

  // Validate project name
  const validation = validateProjectName(name);
  if (!validation.valid) {
    return {
      success: false,
      projectPath: '',
      method: 'embedded-template',
      createdFiles: [],
      nextSteps: [],
      error: validation.error,
    };
  }

  // Target directory for the new project
  const projectPath = resolveWithinRoot(effectiveWorkspace, name);

  // Check if directory exists
  if (existsSync(projectPath)) {
    if (force) {
      logger.info(`Removing existing directory: ${projectPath}`);
      rmSync(projectPath, { recursive: true, force: true });
    } else {
      return {
        success: false,
        projectPath,
        method: 'embedded-template',
        createdFiles: [],
        nextSteps: [],
        error: `Directory already exists: ${projectPath}. Use force=true to overwrite.`,
      };
    }
  }

  // Check if Sails CLI is available
  const hasSailsCli = await checkSailsCli();

  if (hasSailsCli && template === 'counter') {
    // Use Sails CLI
    return await scaffoldWithSailsCli(name, projectPath, effectiveWorkspace);
  } else {
    // Use embedded template
    return await scaffoldWithTemplate(template, name, projectPath);
  }
}

/**
 * Check if cargo-sails is available
 */
async function checkSailsCli(): Promise<boolean> {
  const cargoExists = await commandExists('cargo');
  if (!cargoExists) {
    logger.debug('cargo not found in PATH');
    return false;
  }

  // Check if cargo sails subcommand is available
  const result = await safeSpawn('cargo', ['sails', '--help']);
  return result.success;
}

/**
 * Scaffold using Sails CLI
 */
async function scaffoldWithSailsCli(
  name: string,
  projectPath: string,
  cwd: string
): Promise<ScaffoldResult> {
  logger.info(`Scaffolding with Sails CLI: ${name}`);

  const result = await safeSpawn('cargo', ['sails', 'new-program', name], { cwd });

  if (!result.success) {
    // Fall back to embedded template
    logger.warn('Sails CLI failed, falling back to embedded template');
    logger.debug(result.stderr);
    return await scaffoldWithTemplate('counter', name, projectPath);
  }

  // Get list of created files (we'll estimate since sails doesn't list them)
  const createdFiles = [
    'Cargo.toml',
    'build.rs',
    'src/lib.rs',
    'README.md',
  ];

  return {
    success: true,
    projectPath,
    method: 'sails-cli',
    createdFiles,
    nextSteps: [
      `cd ${name}`,
      'cargo build --release',
      'cargo test',
    ],
  };
}

/**
 * Scaffold using embedded template
 */
async function scaffoldWithTemplate(
  template: TemplateName,
  name: string,
  projectPath: string
): Promise<ScaffoldResult> {
  logger.info(`Scaffolding with embedded template: ${template}`);

  try {
    const result = scaffoldFromTemplate(template, projectPath, {
      PROJECT_NAME: name,
    });

    return {
      success: true,
      projectPath: result.projectPath,
      method: 'embedded-template',
      createdFiles: result.createdFiles,
      nextSteps: result.nextSteps,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      projectPath,
      method: 'embedded-template',
      createdFiles: [],
      nextSteps: [],
      error: errorMessage,
    };
  }
}
