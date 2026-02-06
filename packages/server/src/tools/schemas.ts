import { z } from 'zod';

/**
 * Schema for vara_scaffold_program tool
 */
export const scaffoldProgramSchema = z.object({
  template: z
    .enum(['counter'])
    .default('counter')
    .describe('Template to use for scaffolding'),
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_-]*$/, 'Must be a valid Rust crate name')
    .describe('Project name (must be valid Rust crate name)'),
  workspacePath: z
    .string()
    .optional()
    .describe('Workspace root path (defaults to current directory)'),
  packageManager: z
    .enum(['pnpm', 'npm', 'yarn'])
    .optional()
    .describe('Package manager for client scaffolding (optional)'),
  force: z
    .boolean()
    .default(false)
    .describe('Overwrite existing directory if it exists'),
});

export type ScaffoldProgramInput = z.infer<typeof scaffoldProgramSchema>;

/**
 * Schema for vara_compile tool
 */
export const compileSchema = z.object({
  workspacePath: z
    .string()
    .optional()
    .describe('Workspace root path (defaults to current directory)'),
  projectPath: z
    .string()
    .optional()
    .describe('Path to the Rust project (relative to workspace)'),
  release: z
    .boolean()
    .default(true)
    .describe('Build in release mode (optimized)'),
  target: z
    .string()
    .default('wasm32-gear')
    .describe('Build target (wasm32-gear → output in target/wasm32-gear/release/)'),
  verbose: z.boolean().default(false).describe('Enable verbose output'),
});

export type CompileInput = z.infer<typeof compileSchema>;

/**
 * Schema for vara_test tool
 */
export const testSchema = z.object({
  workspacePath: z
    .string()
    .optional()
    .describe('Workspace root path (defaults to current directory)'),
  projectPath: z
    .string()
    .optional()
    .describe('Path to the Rust project (relative to workspace)'),
  verbose: z.boolean().default(false).describe('Enable verbose output'),
  filter: z.string().optional().describe('Filter tests by name'),
});

export type TestInput = z.infer<typeof testSchema>;

/**
 * Schema for vara_client_scaffold tool
 */
export const clientScaffoldSchema = z.object({
  workspacePath: z
    .string()
    .optional()
    .describe('Workspace root path (defaults to current directory)'),
  projectPath: z
    .string()
    .optional()
    .describe('Path to the Rust project (for reading IDL)'),
  outDir: z
    .string()
    .default('client')
    .describe('Output directory for client code'),
  language: z
    .enum(['ts'])
    .default('ts')
    .describe('Target language (currently only TypeScript supported)'),
});

export type ClientScaffoldInput = z.infer<typeof clientScaffoldSchema>;

/**
 * Schema for vara_docs_search tool
 */
export const docsSearchSchema = z.object({
  query: z.string().min(1).describe('Search query'),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(5)
    .describe('Maximum number of results'),
});

export type DocsSearchInput = z.infer<typeof docsSearchSchema>;

/**
 * Schema for vara_deploy tool (optional, feature-flagged)
 */
export const deploySchema = z.object({
  endpoint: z
    .string()
    .url()
    .default('wss://testnet.vara.network')
    .describe('Vara network WebSocket endpoint'),
  seedEnvVarName: z
    .string()
    .default('VARA_SEED')
    .describe('Name of environment variable containing the seed phrase'),
  wasmPath: z.string().describe('Path to the WASM file to deploy'),
  idlPath: z.string().optional().describe('Path to the IDL file'),
  initPayload: z.string().optional().describe('Initial payload as JSON string'),
});

export type DeployInput = z.infer<typeof deploySchema>;
