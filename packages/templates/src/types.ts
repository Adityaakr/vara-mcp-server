/**
 * Available template names
 */
export type TemplateName = 'counter';

/**
 * Template metadata
 */
export interface TemplateInfo {
  name: TemplateName;
  displayName: string;
  description: string;
  /** Files included in the template */
  files: string[];
  /** Required placeholders */
  placeholders: string[];
}

/**
 * Template variables for substitution
 */
export interface TemplateVariables {
  PROJECT_NAME: string;
  [key: string]: string;
}

/**
 * Result of scaffolding operation
 */
export interface ScaffoldResult {
  /** Directory where the project was created */
  projectPath: string;
  /** List of created files */
  createdFiles: string[];
  /** Next steps for the user */
  nextSteps: string[];
}
