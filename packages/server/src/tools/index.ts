export { scaffoldProgram, type ScaffoldResult } from './scaffold.js';
export { compileProgram, type CompileResult } from './compile.js';
export { testProgram, type TestResult } from './test.js';
export { scaffoldClient, type ClientScaffoldResult } from './client-scaffold.js';
export { searchDocs, type DocsSearchResult } from './docs-search.js';

export {
  scaffoldProgramSchema,
  compileSchema,
  testSchema,
  clientScaffoldSchema,
  docsSearchSchema,
  deploySchema,
  type ScaffoldProgramInput,
  type CompileInput,
  type TestInput,
  type ClientScaffoldInput,
  type DocsSearchInput,
  type DeployInput,
} from './schemas.js';
