# Cursor Setup Guide

This guide explains how to configure Cursor IDE to use the Vara MCP server.

## Prerequisites

1. **Node.js 18+** installed
2. **Cursor IDE** (latest version recommended)
3. **pnpm** package manager (or npm/yarn)

## Installation

### Option 1: From Source (Development)

```bash
# Clone the repository
git clone https://github.com/your-org/vara-mcp.git
cd vara-mcp

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Option 2: From npm (When Published)

```bash
npm install -g @vara-mcp/server
```

## Cursor Configuration

### Project-Level Configuration

Create a `.cursor/mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "vara-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/vara-mcp/packages/server/dist/index.js"],
      "env": {
        "VARA_WORKSPACE_ROOT": "${workspaceFolder}",
        "VARA_DEBUG": "false"
      }
    }
  }
}
```

**Replace `/absolute/path/to/vara-mcp` with the actual path where you cloned/installed the server.**

### User-Level Configuration (Global)

For all projects, add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "vara-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/vara-mcp/packages/server/dist/index.js"],
      "env": {
        "VARA_DEBUG": "false"
      }
    }
  }
}
```

### If Installed Globally via npm

```json
{
  "mcpServers": {
    "vara-mcp": {
      "command": "vara-mcp",
      "env": {
        "VARA_WORKSPACE_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VARA_WORKSPACE_ROOT` | Root directory for file operations | Current working directory |
| `VARA_DEBUG` | Enable debug logging (`true`/`false`) | `false` |
| `VARA_SEED` | Seed phrase for deployment (optional) | Not set |
| `VARA_RPC_URL` | Default RPC endpoint (optional) | `wss://testnet.vara.network` |

## Verifying the Setup

1. **Restart Cursor** after adding the configuration
2. Open the Command Palette (Cmd/Ctrl + Shift + P)
3. Look for MCP-related commands or check the MCP panel
4. The "vara-mcp" server should appear as connected

### Testing with a Simple Command

In Cursor's chat, try:

```
Use the vara_docs_search tool to search for "quickstart"
```

If configured correctly, you should see search results from the bundled documentation.

## Troubleshooting

### Server Not Starting

1. Check the path in `mcp.json` is correct and absolute
2. Ensure the server is built: `pnpm build` in the vara-mcp directory
3. Try running manually: `node /path/to/vara-mcp/packages/server/dist/index.js`

### Permission Errors

Ensure the Node.js process has permission to:
- Read from the vara-mcp installation directory
- Write to your workspace directory

### Debug Mode

Enable debug logging to see detailed output:

```json
{
  "mcpServers": {
    "vara-mcp": {
      "command": "node",
      "args": ["/path/to/vara-mcp/packages/server/dist/index.js"],
      "env": {
        "VARA_DEBUG": "true"
      }
    }
  }
}
```

Check Cursor's Output panel for MCP server logs.

## Available Tools

Once configured, you'll have access to:

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
| `add-feature-to-program` | Guidance on adding features to existing programs |

## Available Resources

| Resource | Description |
|----------|-------------|
| `vara://docs/sails-quickstart` | Getting started with Sails |
| `vara://docs/build-targets` | Build configuration guide |
| `vara://docs/gear-js-basics` | JavaScript SDK basics |

## Example Workflow

1. Open Cursor in a new directory
2. Use the "Create a Vara MVP (Counter)" prompt
3. Follow the guided steps to scaffold, compile, test, and generate a client
4. Start building your Vara dApp!
