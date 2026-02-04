export type { TemplateName, TemplateInfo, TemplateVariables, ScaffoldResult } from './types.js';

export {
  TEMPLATES,
  getAvailableTemplates,
  getTemplateInfo,
  getTemplatePath,
  templateExists,
  readTemplateFile,
  getTemplateFiles,
  scaffoldFromTemplate,
  validateProjectName,
} from './templates.js';
