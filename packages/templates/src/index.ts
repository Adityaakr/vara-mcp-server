export type { TemplateName, TemplateInfo, TemplateVariables, ScaffoldResult } from './types.js';

export {
  TEMPLATES,
  getAvailableTemplates,
  getTemplateInfo,
  templateExists,
  readTemplateFile,
  getTemplateFiles,
  scaffoldFromTemplate,
  validateProjectName,
} from './templates.js';

export {
  getEmbeddedTemplate,
  getEmbeddedTemplateNames,
} from './embedded.js';
