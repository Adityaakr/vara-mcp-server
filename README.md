# Vara MCP Server

[![npm version](https://img.shields.io/npm/v/vara-mcp-server.svg)](https://www.npmjs.com/package/vara-mcp-server)
[![CI](https://github.com/Adityaakr/vara-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/Adityaakr/vara-mcp-server/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

**Build Vara Network smart programs 40-100x faster** with AI-assisted development in Cursor IDE.

A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that lets you scaffold, compile, test, and generate TypeScript clients for [Vara Network](https://vara.network/) smart programs using natural language.

---

## 🚀 Before vs After

### ❌ Before: Traditional Vara Development

```
📋 Manual Steps Required                           ⏱️ Time
─────────────────────────────────────────────────────────
1. Research Sails docs & examples                  30-60 min
2. Manually create Cargo.toml, lib.rs, build.rs   15-30 min  
3. Write service, program, events from scratch     30-60 min
4. Debug build errors (targets, crate-types)       15-45 min
5. Run cargo build, fix errors, repeat             5-10 min
6. Research gear-js API for client code            45-90 min
7. Write TypeScript client from scratch            30-45 min
8. Set up tests with gtest                         20-30 min
─────────────────────────────────────────────────────────
Total: 3-6 hours for a basic counter program 😫
```

### ✅ After: With vara-mcp-server

```
💬 Just Ask in Cursor                              ⏱️ Time
─────────────────────────────────────────────────────────
"Create a Vara MVP called my-counter"              ~2 min
─────────────────────────────────────────────────────────
✓ Complete Rust program with Sails
✓ Service with state, commands, queries, events
✓ Proper Cargo.toml with all dependencies
✓ Build script for WASM compilation
✓ TypeScript client with full API
✓ Ready to deploy!

Total: ~2 minutes 🚀
```

### 📊 Speed Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                Time to First Working Program                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Traditional    ████████████████████████████████████  3-6 hours │
│                                                                 │
│  With MCP       ██  ~2 minutes                                  │
│                                                                 │
│                 └─────────────────────────────────────────────  │
│                           40-100x faster                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

```bash
npm install -g vara-mcp-server
```

## ⚙️ Cursor IDE Setup

Add to your `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "vara-mcp": {
      "command": "npx",
      "args": ["vara-mcp-server"]
    }
  }
}
```

**Restart Cursor** after adding the configuration.

---

## 🛠️ Available Tools

| Tool | Description | Example |
|------|-------------|---------|
| `vara_scaffold_program` | Create new Vara program from template | *"Create a counter program called my-dapp"* |
| `vara_compile` | Compile to optimized WASM | *"Compile my-dapp in release mode"* |
| `vara_test` | Run program tests | *"Run tests for my-dapp"* |
| `vara_client_scaffold` | Generate TypeScript client | *"Generate a client for my-dapp"* |
| `vara_docs_search` | Search Vara/Sails documentation | *"How do I emit events in Sails?"* |

---

## 💬 Available Prompts

### Create a Vara MVP
Runs the complete workflow automatically:
```
Scaffold → Compile → Test → Generate Client
```

### Add Feature to Program
Get guidance on adding new features to existing programs with code suggestions.

---

## 📚 Available Resources

Access bundled documentation directly in Cursor:

- **Vara Sails Quickstart** - Getting started guide
- **Build Targets & Gotchas** - Common issues and solutions  
- **Gear-JS Interaction Basics** - JavaScript SDK guide

---

## 🎯 Example Usage

### 1. Create a New Program

In Cursor chat:
```
Create a Vara smart program called "my-token" using the counter template
```

### 2. Compile to WASM

```
Compile my-token in release mode
```

Output:
```
✓ my_token.opt.wasm (73 KB)
✓ my_token.idl
```

### 3. Generate TypeScript Client

```
Generate a TypeScript client for my-token
```

### 4. Use the Client

```typescript
import { MyTokenClient } from './my-token-client';

const client = new MyTokenClient();
await client.connect('wss://testnet.vara.network');
await client.initKeyring(process.env.VARA_SEED);

// Upload program
const programId = await client.uploadProgram({
  wasmPath: './target/wasm32-gear/release/my_token.opt.wasm'
});

// Interact
await client.sendMessage({ payload: { Counter: { Increment: null } } });
const state = await client.readState();
```

---

## 🔒 Security

This server implements strict security measures:

| Feature | Implementation |
|---------|----------------|
| **Command Allowlist** | Only `cargo`, `node`, `npm/pnpm/yarn`, `rustup` allowed |
| **Path Sandboxing** | All file operations restricted to workspace root |
| **No Shell Execution** | Commands spawned directly with `shell: false` |
| **No Secret Persistence** | Secrets read from env vars only, never logged |

See [security.md](docs/security.md) for details.

---

## 🧪 Development

### Prerequisites

- Node.js 18+
- pnpm 9+
- Rust toolchain (for testing builds)

### Setup

```bash
git clone https://github.com/Adityaakr/vara-mcp-server.git
cd vara-mcp-server
pnpm install
pnpm build
pnpm test
```

### Run Locally

```bash
node packages/server/dist/index.js
```

---

## 📁 Project Structure

```
vara-mcp-server/
├── packages/
│   ├── server/      # MCP server entry point
│   ├── runtime/     # Safe execution utilities
│   ├── templates/   # Sails program templates
│   └── chain/       # TypeScript client generator
├── docs/
│   ├── cursor-setup.md
│   ├── security.md
│   └── troubleshooting.md
└── README.md
```

---

## 🐛 Troubleshooting

### cargo not found
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Build output location
Scaffolded projects use \`target/wasm32-gear/release/\` (no wasm32-unknown-unknown). Run \`cargo build --release\`; \`.wasm\`, \`.opt.wasm\`, and \`.idl\` are always generated there.

### Server not connecting in Cursor
1. Check path in `.cursor/mcp.json`
2. Restart Cursor completely
3. Enable debug mode: `"env": { "VARA_DEBUG": "true" }`

See [troubleshooting.md](docs/troubleshooting.md) for more solutions.

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT © [Aditya Kumar](https://github.com/Adityaakr)

---

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/vara-mcp-server)
- [GitHub Repository](https://github.com/Adityaakr/vara-mcp-server)
- [Vara Network](https://vara.network/)
- [Sails Framework](https://docs.gear.rs/sails/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

<p align="center">
  <b>Built for the Vara Network ecosystem</b><br>
  <sub>Supercharge your Vara development with AI ⚡</sub>
</p>
