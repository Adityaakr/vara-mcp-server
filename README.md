# Vara MCP Server

[![CI](https://github.com/vara-network/vara-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/vara-network/vara-mcp/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@vara-network%2Fmcp-server.svg)](https://www.npmjs.com/package/@vara-network/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for Vara Network smart program development with Sails.

> **40-100x faster** Vara development - scaffold, compile, test, and generate clients with simple chat commands.

## Features

- **Scaffold**: Create new Vara programs from templates (Sails CLI or embedded)
- **Compile**: Build programs to WASM with automatic IDL generation
- **Test**: Run program tests with detailed results
- **Client Generate**: Create TypeScript clients for your programs
- **Documentation**: Search bundled Vara/Sails documentation

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/vara-mcp.git
cd vara-mcp

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Cursor Configuration

Create `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` for global):

```json
{
  "mcpServers": {
    "vara-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/vara-mcp/packages/server/dist/index.js"],
      "env": {
        "VARA_WORKSPACE_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

### Demo: Create a Vara MVP

1. Open Cursor in a new directory
2. Use the chat to invoke the "Create a Vara MVP (Counter)" prompt
3. The server will scaffold, compile, test, and generate a client

Or use tools directly:

```
Use vara_scaffold_program with name "my-counter" and template "counter"
```

```
Use vara_compile with projectPath "my-counter" and release true
```

```
Use vara_test with projectPath "my-counter"
```

```
Use vara_client_scaffold with projectPath "my-counter" and outDir "my-counter-client"
```

## Project Structure

```
vara-mcp/
├── packages/
│   ├── server/          # MCP server (main entry point)
│   ├── runtime/         # Safe execution utilities
│   ├── templates/       # Embedded program templates
│   └── chain/           # Gear-JS helpers
├── docs/
│   ├── cursor-setup.md  # Detailed Cursor configuration
│   ├── security.md      # Security model documentation
│   └── troubleshooting.md
└── README.md
```

## Available Tools

| Tool | Description |
|------|-------------|
| `vara_scaffold_program` | Create a new Vara program from template |
| `vara_compile` | Compile a program to WASM |
| `vara_test` | Run program tests |
| `vara_client_scaffold` | Generate TypeScript client |
| `vara_docs_search` | Search documentation |

## Available Prompts

| Prompt | Description |
|--------|-------------|
| `create-vara-mvp` | Full workflow: scaffold → compile → test → client |
| `add-feature-to-program` | Guidance on adding features |

## Available Resources

| Resource | Description |
|----------|-------------|
| `vara://docs/sails-quickstart` | Getting started with Sails |
| `vara://docs/build-targets` | Build configuration guide |
| `vara://docs/gear-js-basics` | JavaScript SDK basics |

## Development

### Prerequisites

- Node.js 18+
- pnpm 9+
- Rust toolchain (for testing actual builds)

### Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Watch mode (development)
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Format code
pnpm format
```

### Running the Server Directly

```bash
node packages/server/dist/index.js
```

### Debug Mode

```bash
VARA_DEBUG=true node packages/server/dist/index.js
```

## Security

The server implements strict security measures:

- **Command Allowlist**: Only specific commands can be executed
- **Path Sandboxing**: File operations restricted to workspace
- **No Shell Execution**: Commands spawned directly, not through shell
- **No Secret Persistence**: Sensitive data never written to disk

See [docs/security.md](docs/security.md) for details.

## Troubleshooting

Common issues and solutions are documented in [docs/troubleshooting.md](docs/troubleshooting.md).

### Quick Fixes

**cargo not found:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**WASM target not installed:**
```bash
rustup target add wasm32-unknown-unknown
```

**Server won't start:**
1. Check the path in `.cursor/mcp.json`
2. Ensure `pnpm build` completed successfully
3. Test manually: `node packages/server/dist/index.js`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VARA_WORKSPACE_ROOT` | Root directory for operations | `process.cwd()` |
| `VARA_DEBUG` | Enable debug logging | `false` |
| `VARA_SEED` | Seed phrase for deployment | (not set) |
| `VARA_RPC_URL` | Default RPC endpoint | `wss://testnet.vara.network` |

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## Resources

- [Vara Network](https://vara.network/)
- [Sails Framework](https://docs.gear.rs/sails/)
- [Gear Protocol](https://gear-tech.io/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
