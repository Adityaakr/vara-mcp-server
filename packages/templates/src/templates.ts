import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TemplateName, TemplateInfo, TemplateVariables, ScaffoldResult } from './types.js';

// Get the directory of this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Templates directory (relative to built dist or source)
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

/**
 * Available templates registry
 */
export const TEMPLATES: Record<TemplateName, TemplateInfo> = {
  counter: {
    name: 'counter',
    displayName: 'Counter Program',
    description: 'A simple counter smart program demonstrating basic Sails patterns',
    files: [
      'Cargo.toml',
      'build.rs',
      'src/lib.rs',
      'tests/counter_test.rs',
      'README.md',
      '.gitignore',
      'rust-toolchain.toml',
    ],
    placeholders: ['PROJECT_NAME'],
  },
};

/**
 * Get all available template names
 */
export function getAvailableTemplates(): TemplateName[] {
  return Object.keys(TEMPLATES) as TemplateName[];
}

/**
 * Get template info by name
 */
export function getTemplateInfo(name: TemplateName): TemplateInfo | undefined {
  return TEMPLATES[name];
}

/**
 * Get the path to a template directory
 */
export function getTemplatePath(name: TemplateName): string {
  return join(TEMPLATES_DIR, name);
}

/**
 * Check if a template exists
 */
export function templateExists(name: TemplateName): boolean {
  const templatePath = getTemplatePath(name);
  return existsSync(templatePath);
}

/**
 * Read a template file and substitute variables
 */
export function readTemplateFile(
  templateName: TemplateName,
  filePath: string,
  variables: TemplateVariables
): string {
  const fullPath = join(getTemplatePath(templateName), filePath);
  
  if (!existsSync(fullPath)) {
    throw new Error(`Template file not found: ${fullPath}`);
  }

  let content = readFileSync(fullPath, 'utf-8');

  // Substitute all variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    content = content.split(placeholder).join(value);
  }

  return content;
}

/**
 * Get all files in a template directory recursively
 */
export function getTemplateFiles(templateName: TemplateName): string[] {
  const templatePath = getTemplatePath(templateName);
  const files: string[] = [];

  function walkDir(dir: string): void {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        files.push(relative(templatePath, fullPath));
      }
    }
  }

  if (existsSync(templatePath)) {
    walkDir(templatePath);
  }

  return files;
}

/**
 * Scaffold a project from a template
 */
export function scaffoldFromTemplate(
  templateName: TemplateName,
  targetDir: string,
  variables: TemplateVariables
): ScaffoldResult {
  const templatePath = getTemplatePath(templateName);
  
  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }

  // Ensure target directory exists
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const files = getTemplateFiles(templateName);
  const createdFiles: string[] = [];

  for (const file of files) {
    const content = readTemplateFile(templateName, file, variables);
    const targetPath = join(targetDir, file);
    const targetDirPath = dirname(targetPath);

    // Ensure directory exists
    if (!existsSync(targetDirPath)) {
      mkdirSync(targetDirPath, { recursive: true });
    }

    // Write the file
    writeFileSync(targetPath, content, 'utf-8');
    createdFiles.push(file);
  }

  // Generate next steps based on template
  const nextSteps = generateNextSteps(templateName, variables.PROJECT_NAME);

  return {
    projectPath: targetDir,
    createdFiles,
    nextSteps,
  };
}

/**
 * Generate next steps instructions
 */
function generateNextSteps(templateName: TemplateName, projectName: string): string[] {
  const steps: string[] = [];

  switch (templateName) {
    case 'counter':
      steps.push(
        `cd ${projectName}`,
        'Ensure Rust wasm32 target is installed: rustup target add wasm32-unknown-unknown',
        'Build the program: cargo build --release',
        'Run tests: cargo test',
        'Find the WASM file at: target/wasm32-unknown-unknown/release/*.opt.wasm',
        'Find the IDL file at: target/wasm32-unknown-unknown/release/*.idl'
      );
      break;
    default:
      steps.push('Review the generated files', 'Build and test the project');
  }

  return steps;
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  // Must not be empty
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name cannot be empty' };
  }

  // Must be valid Rust crate name (lowercase, alphanumeric, underscores, hyphens)
  const crateNameRegex = /^[a-z][a-z0-9_-]*$/;
  if (!crateNameRegex.test(name)) {
    return {
      valid: false,
      error: 'Project name must start with a letter and contain only lowercase letters, numbers, underscores, or hyphens',
    };
  }

  // Must not be a Rust keyword
  const rustKeywords = [
    'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern',
    'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod',
    'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct',
    'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while',
    'async', 'await', 'dyn', 'abstract', 'become', 'box', 'do', 'final',
    'macro', 'override', 'priv', 'typeof', 'unsized', 'virtual', 'yield', 'try',
  ];
  
  if (rustKeywords.includes(name)) {
    return { valid: false, error: `"${name}" is a Rust reserved keyword` };
  }

  return { valid: true };
}
