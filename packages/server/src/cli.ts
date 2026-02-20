/* eslint-disable no-console */
/**
 * Vara MCP CLI
 * 
 * Standalone command-line interface for Vara program development.
 * Use this when you want to run commands directly without MCP/Cursor.
 * 
 * Usage:
 *   vara-mcp scaffold <name> [--template counter] [--force]
 *   vara-mcp compile [path] [--release] [--verbose]
 *   vara-mcp test [path] [--verbose] [--filter <name>]
 *   vara-mcp client [path] [--out-dir client]
 *   vara-mcp search <query> [--max-results 5]
 *   vara-mcp serve    # Start MCP server (default mode)
 */

import { parseArgs } from 'node:util';

import {
  scaffoldProgram,
  compileProgram,
  testProgram,
  scaffoldClient,
  searchDocs,
} from './tools/index.js';

const HELP = `
vara-mcp - Vara Network Smart Program Development Tool

USAGE:
  vara-mcp <command> [options]

COMMANDS:
  scaffold <name>     Create a new Vara program from template
  compile [path]      Compile program to WASM
  test [path]         Run program tests
  client [path]       Generate TypeScript client
  search <query>      Search Vara documentation
  serve               Start MCP server for Cursor IDE (default)

SCAFFOLD OPTIONS:
  --template, -t      Template to use (default: counter)
  --force, -f         Overwrite existing directory

COMPILE OPTIONS:
  --release, -r       Build in release mode (default: true)
  --verbose, -v       Show verbose output

TEST OPTIONS:
  --verbose, -v       Show verbose output
  --filter            Filter tests by name

CLIENT OPTIONS:
  --out-dir, -o       Output directory (default: client)

SEARCH OPTIONS:
  --max-results, -n   Max results to show (default: 5)

EXAMPLES:
  vara-mcp scaffold my-counter
  vara-mcp scaffold my-app --template counter --force
  vara-mcp compile ./my-counter
  vara-mcp test ./my-counter --verbose
  vara-mcp client ./my-counter --out-dir ./client
  vara-mcp search "how to send messages"

For MCP/Cursor integration, run without arguments or use 'serve':
  vara-mcp serve
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // No arguments or 'serve' = start MCP server
  if (args.length === 0 || args[0] === 'serve') {
    // Import and run the MCP server
    await import('./index.js');
    return;
  }

  // Help
  if (args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
    console.log(HELP);
    process.exit(0);
  }

  const command = args[0];
  const workspaceRoot = process.cwd();

  try {
    switch (command) {
      case 'scaffold':
        await handleScaffold(args.slice(1), workspaceRoot);
        break;
      case 'compile':
        await handleCompile(args.slice(1), workspaceRoot);
        break;
      case 'test':
        await handleTest(args.slice(1), workspaceRoot);
        break;
      case 'client':
        await handleClient(args.slice(1), workspaceRoot);
        break;
      case 'search':
        await handleSearch(args.slice(1));
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log('\nRun "vara-mcp --help" for usage information.');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function handleScaffold(args: string[], workspaceRoot: string): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      template: { type: 'string', short: 't', default: 'counter' },
      force: { type: 'boolean', short: 'f', default: false },
    },
    allowPositionals: true,
  });

  const name = positionals[0];
  if (!name) {
    console.error('Error: Project name is required');
    console.log('Usage: vara-mcp scaffold <name> [--template counter] [--force]');
    process.exit(1);
  }

  console.log(`\n🚀 Scaffolding new Vara program: ${name}\n`);

  const result = await scaffoldProgram(
    {
      name,
      template: values.template as 'counter',
      force: values.force,
    },
    workspaceRoot
  );

  if (!result.success) {
    console.error(`❌ Scaffold failed: ${result.error}`);
    process.exit(1);
  }

  console.log(`✅ Project created at: ${result.projectPath}\n`);
  console.log('Created files:');
  result.createdFiles.forEach((f) => console.log(`  - ${f}`));
  console.log('\nNext steps:');
  result.nextSteps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
}

async function handleCompile(args: string[], workspaceRoot: string): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      release: { type: 'boolean', short: 'r', default: true },
      verbose: { type: 'boolean', short: 'v', default: false },
    },
    allowPositionals: true,
  });

  const projectPath = positionals[0] || '.';

  console.log(`\n🔨 Compiling Vara program...\n`);

  const result = await compileProgram(
    {
      projectPath,
      release: values.release,
      target: 'wasm32v1-none',
      verbose: values.verbose,
    },
    workspaceRoot
  );

  if (!result.success) {
    console.error(`❌ Compilation failed: ${result.error}`);
    if (result.stderr) {
      console.error('\nOutput:\n', result.stderr);
    }
    process.exit(1);
  }

  console.log('✅ Compilation successful!\n');
  
  if (result.wasmPaths.length > 0) {
    console.log('WASM files:');
    result.wasmPaths.forEach((p) => console.log(`  - ${p}`));
  }
  
  if (result.idlPaths.length > 0) {
    console.log('\nIDL files:');
    result.idlPaths.forEach((p) => console.log(`  - ${p}`));
  }
}

async function handleTest(args: string[], workspaceRoot: string): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      verbose: { type: 'boolean', short: 'v', default: false },
      filter: { type: 'string' },
    },
    allowPositionals: true,
  });

  const projectPath = positionals[0] || '.';

  console.log(`\n🧪 Running tests...\n`);

  const result = await testProgram(
    {
      projectPath,
      verbose: values.verbose,
      filter: values.filter,
    },
    workspaceRoot
  );

  console.log(`\n${result.success ? '✅' : '❌'} ${result.summary}`);
  console.log(`   Passed: ${result.passed}`);
  console.log(`   Failed: ${result.failed}`);
  console.log(`   Ignored: ${result.ignored}`);

  if (!result.success) {
    if (result.stdout || result.stderr) {
      console.log('\nOutput:');
      console.log(result.stdout);
      console.log(result.stderr);
    }
    process.exit(1);
  }
}

async function handleClient(args: string[], workspaceRoot: string): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      'out-dir': { type: 'string', short: 'o', default: 'client' },
    },
    allowPositionals: true,
  });

  const projectPath = positionals[0] || '.';

  console.log(`\n📦 Generating TypeScript client...\n`);

  const result = await scaffoldClient(
    {
      projectPath,
      outDir: values['out-dir'],
      language: 'ts' as const,
    },
    workspaceRoot
  );

  if (!result.success) {
    console.error(`❌ Client generation failed: ${result.error}`);
    process.exit(1);
  }

  console.log(`✅ Client generated at: ${result.outDir}\n`);
  console.log('Created files:');
  result.createdFiles.forEach((f) => console.log(`  - ${f}`));
  
  console.log('\nBuild artifacts:');
  console.log(`  WASM: ${result.wasmPath || 'Not found (compile first)'}`);
  console.log(`  IDL: ${result.idlPath || 'Not found (compile first)'}`);
  
  console.log('\nNext steps:');
  result.nextSteps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
}

async function handleSearch(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      'max-results': { type: 'string', short: 'n', default: '5' },
    },
    allowPositionals: true,
  });

  const query = positionals.join(' ');
  if (!query) {
    console.error('Error: Search query is required');
    console.log('Usage: vara-mcp search <query> [--max-results 5]');
    process.exit(1);
  }

  console.log(`\n🔍 Searching for: "${query}"\n`);

  const result = searchDocs({
    query,
    maxResults: parseInt(values['max-results'] || '5', 10),
  });

  if (result.results.length === 0) {
    console.log('No results found. Try different search terms.');
    return;
  }

  console.log(`Found ${result.totalFound} results:\n`);

  result.results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   Section: ${r.section}`);
    console.log(`   Relevance: ${(r.relevance * 100).toFixed(0)}%`);
    console.log(`   ${r.snippet.slice(0, 200)}...`);
    console.log();
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
