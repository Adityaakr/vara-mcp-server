/**
 * Vara MCP Server
 * 
 * An MCP server for Vara Network smart program development with Sails.
 * 
 * Features:
 * - Tools for scaffolding, compiling, testing, and generating clients
 * - Prompts for common workflows (Create MVP, Add Feature)
 * - Resources with Vara/Sails documentation
 * 
 * Security:
 * - Command allowlist (no arbitrary shell execution)
 * - Path sandboxing (writes restricted to workspace)
 * - No secret persistence
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { logger } from '@vara-mcp/runtime';

import {
  scaffoldProgram,
  compileProgram,
  testProgram,
  scaffoldClient,
  searchDocs,
  scaffoldProgramSchema,
  compileSchema,
  testSchema,
  clientScaffoldSchema,
  docsSearchSchema,
} from './tools/index.js';

import { getPromptDefinitions, getPromptMessages } from './prompts/index.js';
import { getResourceDefinitions, getResourceContent } from './resources/index.js';

// Server metadata
const SERVER_NAME = 'vara-mcp';
const SERVER_VERSION = '0.1.0';

// Get workspace root from environment or current directory
const WORKSPACE_ROOT = process.env.VARA_WORKSPACE_ROOT || process.cwd();

/**
 * Create and configure the MCP server
 */
function createServer(): Server {
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    }
  );

  // Register tool handlers
  registerToolHandlers(server);

  // Register prompt handlers
  registerPromptHandlers(server);

  // Register resource handlers
  registerResourceHandlers(server);

  return server;
}

/**
 * Register tool handlers
 */
function registerToolHandlers(server: Server): void {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'vara_scaffold_program',
          description:
            'Scaffold a new Vara smart program from a template. Prefers Sails CLI if available, falls back to embedded templates.',
          inputSchema: {
            type: 'object',
            properties: {
              template: {
                type: 'string',
                enum: ['counter'],
                default: 'counter',
                description: 'Template to use for scaffolding',
              },
              name: {
                type: 'string',
                description: 'Project name (must be valid Rust crate name)',
              },
              workspacePath: {
                type: 'string',
                description: 'Workspace root path (defaults to current directory)',
              },
              packageManager: {
                type: 'string',
                enum: ['pnpm', 'npm', 'yarn'],
                description: 'Package manager for client scaffolding',
              },
              force: {
                type: 'boolean',
                default: false,
                description: 'Overwrite existing directory if it exists',
              },
            },
            required: ['name'],
          },
        },
        {
          name: 'vara_compile',
          description:
            'Compile a Vara smart program to WASM. Returns paths to generated WASM and IDL files.',
          inputSchema: {
            type: 'object',
            properties: {
              workspacePath: {
                type: 'string',
                description: 'Workspace root path',
              },
              projectPath: {
                type: 'string',
                description: 'Path to the Rust project (relative to workspace)',
              },
              release: {
                type: 'boolean',
                default: true,
                description: 'Build in release mode (optimized)',
              },
              target: {
                type: 'string',
                default: 'wasm32v1-none',
                description: 'Build target (wasm32v1-none → target/wasm32v1-none/release/; install: rustup target add wasm32v1-none)',
              },
              verbose: {
                type: 'boolean',
                default: false,
                description: 'Enable verbose output',
              },
            },
          },
        },
        {
          name: 'vara_test',
          description: 'Run tests for a Vara smart program. Returns test results and summary.',
          inputSchema: {
            type: 'object',
            properties: {
              workspacePath: {
                type: 'string',
                description: 'Workspace root path',
              },
              projectPath: {
                type: 'string',
                description: 'Path to the Rust project',
              },
              verbose: {
                type: 'boolean',
                default: false,
                description: 'Enable verbose output',
              },
              filter: {
                type: 'string',
                description: 'Filter tests by name',
              },
            },
          },
        },
        {
          name: 'vara_client_scaffold',
          description:
            'Generate a TypeScript client for a Vara program. Includes connection, upload, message, and state reading functionality.',
          inputSchema: {
            type: 'object',
            properties: {
              workspacePath: {
                type: 'string',
                description: 'Workspace root path',
              },
              projectPath: {
                type: 'string',
                description: 'Path to the Rust project (for reading IDL)',
              },
              outDir: {
                type: 'string',
                default: 'client',
                description: 'Output directory for client code',
              },
              language: {
                type: 'string',
                enum: ['ts'],
                default: 'ts',
                description: 'Target language',
              },
            },
          },
        },
        {
          name: 'vara_docs_search',
          description:
            'Search the bundled Vara/Sails documentation. Returns relevant snippets with context.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              maxResults: {
                type: 'number',
                default: 5,
                description: 'Maximum number of results (1-20)',
              },
            },
            required: ['query'],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info(`Tool called: ${name}`, args);

    try {
      switch (name) {
        case 'vara_scaffold_program': {
          const input = scaffoldProgramSchema.parse(args);
          const result = await scaffoldProgram(input, WORKSPACE_ROOT);
          return {
            content: [
              {
                type: 'text',
                text: formatScaffoldResult(result),
              },
            ],
          };
        }

        case 'vara_compile': {
          const input = compileSchema.parse(args);
          const result = await compileProgram(input, WORKSPACE_ROOT);
          return {
            content: [
              {
                type: 'text',
                text: formatCompileResult(result),
              },
            ],
          };
        }

        case 'vara_test': {
          const input = testSchema.parse(args);
          const result = await testProgram(input, WORKSPACE_ROOT);
          return {
            content: [
              {
                type: 'text',
                text: formatTestResult(result),
              },
            ],
          };
        }

        case 'vara_client_scaffold': {
          const input = clientScaffoldSchema.parse(args);
          const result = await scaffoldClient(input, WORKSPACE_ROOT);
          return {
            content: [
              {
                type: 'text',
                text: formatClientScaffoldResult(result),
              },
            ],
          };
        }

        case 'vara_docs_search': {
          const input = docsSearchSchema.parse(args);
          const result = searchDocs(input);
          return {
            content: [
              {
                type: 'text',
                text: formatDocsSearchResult(result),
              },
            ],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      logger.error(`Tool error: ${name}`, error);
      
      if (error instanceof McpError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${message}`,
          },
        ],
        isError: true,
      };
    }
  });
}

/**
 * Register prompt handlers
 */
function registerPromptHandlers(server: Server): void {
  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    const definitions = getPromptDefinitions();
    return {
      prompts: definitions.map((p) => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments,
      })),
    };
  });

  // Get prompt messages
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const messages = getPromptMessages(name, args ?? {});
    if (!messages) {
      throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
    }

    return { messages };
  });
}

/**
 * Register resource handlers
 */
function registerResourceHandlers(server: Server): void {
  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const definitions = getResourceDefinitions();
    return {
      resources: definitions.map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
    };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    const content = getResourceContent(uri);
    if (!content) {
      throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: content,
        },
      ],
    };
  });
}

// Result formatting functions

function formatScaffoldResult(result: Awaited<ReturnType<typeof scaffoldProgram>>): string {
  if (!result.success) {
    return `## Scaffold Failed\n\n**Error:** ${result.error}`;
  }

  return `## Scaffold Successful

**Project Path:** \`${result.projectPath}\`
**Method:** ${result.method === 'sails-cli' ? 'Sails CLI' : 'Embedded Template'}

### Created Files
${result.createdFiles.map((f) => `- \`${f}\``).join('\n')}

### Next Steps
${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
}

function formatCompileResult(result: Awaited<ReturnType<typeof compileProgram>>): string {
  if (!result.success) {
    return `## Compilation Failed

**Error:** ${result.error}

### stderr
\`\`\`
${result.stderr}
\`\`\``;
  }

  return `## Compilation Successful

### Output Files

**WASM:**
${result.wasmPaths.length > 0 ? result.wasmPaths.map((p) => `- \`${p}\``).join('\n') : '- No WASM files found'}

**IDL:**
${result.idlPaths.length > 0 ? result.idlPaths.map((p) => `- \`${p}\``).join('\n') : '- No IDL files found'}

${result.stderr ? `### Build Output\n\`\`\`\n${result.stderr.slice(0, 2000)}\n\`\`\`` : ''}`;
}

function formatTestResult(result: Awaited<ReturnType<typeof testProgram>>): string {
  const statusEmoji = result.success ? 'PASSED' : 'FAILED';

  return `## Test Results: ${statusEmoji}

**Summary:** ${result.summary}

| Metric | Count |
|--------|-------|
| Passed | ${result.passed} |
| Failed | ${result.failed} |
| Ignored | ${result.ignored} |

${result.failed > 0 || !result.success ? `### Output\n\`\`\`\n${(result.stdout + result.stderr).slice(0, 3000)}\n\`\`\`` : ''}`;
}

function formatClientScaffoldResult(
  result: Awaited<ReturnType<typeof scaffoldClient>>
): string {
  if (!result.success) {
    return `## Client Scaffold Failed\n\n**Error:** ${result.error}`;
  }

  return `## Client Scaffold Successful

**Output Directory:** \`${result.outDir}\`

### Created Files
${result.createdFiles.map((f) => `- \`${f}\``).join('\n')}

### Build Artifacts
- **WASM:** ${result.wasmPath ? `\`${result.wasmPath}\`` : 'Not found (build the program first)'}
- **IDL:** ${result.idlPath ? `\`${result.idlPath}\`` : 'Not found (build the program first)'}

### Next Steps
${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
}

function formatDocsSearchResult(result: Awaited<ReturnType<typeof searchDocs>>): string {
  if (result.results.length === 0) {
    return `## No Results Found

Try different search terms or check the available resources.`;
  }

  return `## Search Results (${result.totalFound} found)

${result.results
  .map(
    (r, i) => `### ${i + 1}. ${r.title}
**Section:** ${r.section}
**Relevance:** ${(r.relevance * 100).toFixed(0)}%

${r.snippet}

---`
  )
  .join('\n\n')}`;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Configure logger for debug mode
  if (process.env.VARA_DEBUG === 'true') {
    logger.setLevel('debug');
  }

  logger.info(`Starting ${SERVER_NAME} v${SERVER_VERSION}`);
  logger.info(`Workspace root: ${WORKSPACE_ROOT}`);

  // Create server
  const server = createServer();

  // Create STDIO transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  logger.info('Server connected and ready');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Shutting down...');
    await server.close();
    process.exit(0);
  });
}

// Run the server
main().catch((error) => {
  logger.error('Fatal error', error);
  process.exit(1);
});
