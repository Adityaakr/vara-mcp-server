import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { TemplateName, TemplateInfo, TemplateVariables, ScaffoldResult } from './types.js';
import { getEmbeddedTemplate, getEmbeddedTemplateNames } from './embedded.js';

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
      'idl/{{PROJECT_NAME}}.idl',
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
  return getEmbeddedTemplateNames() as TemplateName[];
}

/**
 * Get template info by name
 */
export function getTemplateInfo(name: TemplateName): TemplateInfo | undefined {
  return TEMPLATES[name];
}

/**
 * Check if a template exists
 */
export function templateExists(name: TemplateName): boolean {
  return getEmbeddedTemplate(name) !== undefined;
}

/**
 * Read a template file content and substitute variables
 */
export function readTemplateFile(
  templateName: TemplateName,
  filePath: string,
  variables: TemplateVariables
): string {
  const template = getEmbeddedTemplate(templateName);
  
  if (!template) {
    throw new Error(`Template not found: ${templateName}`);
  }

  const file = template.files.find(f => f.path === filePath);
  if (!file) {
    throw new Error(`Template file not found: ${filePath} in ${templateName}`);
  }

  let content = file.content;

  // Substitute all variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    content = content.split(placeholder).join(value);
  }

  return content;
}

/**
 * Get all files in a template
 */
export function getTemplateFiles(templateName: TemplateName): string[] {
  const template = getEmbeddedTemplate(templateName);
  if (!template) {
    return [];
  }
  return template.files.map(f => f.path);
}

/**
 * Scaffold a project from a template
 */
export function scaffoldFromTemplate(
  templateName: TemplateName,
  targetDir: string,
  variables: TemplateVariables
): ScaffoldResult {
  const template = getEmbeddedTemplate(templateName);
  
  if (!template) {
    throw new Error(`Template not found: ${templateName}`);
  }

  // Ensure target directory exists
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const createdFiles: string[] = [];

  for (const file of template.files) {
    let content = file.content;
    let resolvedPath = file.path;

    // Substitute all variables in content and path
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      content = content.split(placeholder).join(value);
      resolvedPath = resolvedPath.split(placeholder).join(value);
    }

    const targetPath = join(targetDir, resolvedPath);
    const targetDirPath = dirname(targetPath);

    // Ensure directory exists
    if (!existsSync(targetDirPath)) {
      mkdirSync(targetDirPath, { recursive: true });
    }

    // Write the file
    writeFileSync(targetPath, content, 'utf-8');
    createdFiles.push(resolvedPath);
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
        'Add target: rustup target add wasm32v1-none',
        'Build: cargo build --release',
        'Output (same folder): target/wasm32v1-none/wasm32-gear/release/',
        '  - *.opt.wasm (deploy this)',
        '  - *.idl (interface; always generated)',
        '  - *.wasm'
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
