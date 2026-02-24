# verify-vara

Starter template and reference for **Vara Network** development using **vara-mcp-server**. This repo includes a Sails counter program and shows how dev time looks when you use the MCP server (Cursor) and the CLI.

---

## What’s available now

### 1. **vara-mcp-server (npm)**

- **Install:** `npm install -g vara-mcp-server@latest`
- **CLI:** `vara-mcp` with:
  - `vara-mcp scaffold <name>` – create a new Vara program (counter template)
  - `vara-mcp compile [path]` – build to WASM (`--target wasm32v1-none`)
  - `vara-mcp test [path]` – run tests
  - `vara-mcp client [path]` – generate TypeScript client from IDL
  - `vara-mcp search <query>` – search Vara docs
  - `vara-mcp serve` – start MCP server for Cursor

### 2. **MCP tools (Cursor)**

When the **vara-mcp-server** MCP is enabled in Cursor you get:

| Tool | Purpose |
|------|--------|
| `vara_scaffold_program` | Scaffold a program (e.g. counter) by name and template |
| `vara_compile` | Compile program to WASM/IDL |
| `vara_test` | Run program tests |
| `vara_client_scaffold` | Generate TS client from IDL |
| `vara_docs_search` | Search Vara documentation |

### 3. **This repo**

- **`my_dapp/`** – Sails 0.10 counter program (Vara):
  - Commands: `add`, `sub`, `increment`, `decrement`, `reset`
  - Query: `value`
  - Events: `Added`, `Subtracted`, `Reset`
  - IDL in `idl/my_dapp.idl` (matches `.opt.wasm` for upload)
  - Optional **xtask** to regenerate IDL from source

---

## Dev workflow with vara-mcp-server

### Option A: CLI only

```bash
# 1. Install
npm install -g vara-mcp-server@latest

# 2. Scaffold (from your workspace)
vara-mcp scaffold my_dapp --template counter

# 3. Build
cd my_dapp
rustup target add wasm32v1-none
vara-mcp compile .   # or: cargo build --release

# 4. Test
vara-mcp test .

# 5. (Optional) Generate TS client
vara-mcp client . --out-dir client
```

### Option B: Cursor + MCP

1. Enable the **vara-mcp-server** MCP in Cursor.
2. In chat, ask to:
   - “Scaffold a counter program named my_dapp”
   - “Compile my_dapp”
   - “Run tests for my_dapp”
   - “Generate the TypeScript client for my_dapp”
3. The agent uses `vara_scaffold_program`, `vara_compile`, `vara_test`, `vara_client_scaffold` under the hood.

### Option C: Use this template

```bash
# From this repo (after clone or npm pack)
cd my_dapp
cargo build --release
# Artifacts: target/wasm32v1-none/wasm32-gear/release/*.opt.wasm, *.idl
```

---

## How dev time looks now

- **Scaffold:** One command or one MCP call (no manual Cargo/Sails setup).
- **Build:** `vara-mcp compile ./my_dapp` or `cargo build --release`; IDL is copied from `idl/my_dapp.idl` so it matches the program.
- **Test:** `vara-mcp test ./my_dapp` or `cargo test`.
- **Client:** `vara-mcp client ./my_dapp` generates a TS client from the IDL.
- **Docs:** `vara-mcp search "how to send messages"` or MCP docs search.

Upload: use `.opt.wasm` and `.idl` from `target/wasm32v1-none/wasm32-gear/release/` (e.g. Gear IDEA, sails-js).

---

## In progress

These are planned or partial; not yet fully available or documented:

| Item | Status | Notes |
|------|--------|--------|
| **Access token / auth** | In progress | npm and MCP auth flows (e.g. for private packages or secured tools). |
| **More MCP prompts** | Planned | Extra Cursor prompts for “add feature”, “deploy”, etc. |
| **Client scaffold defaults** | In progress | Smoother defaults for `vara_client_scaffold` (e.g. outDir, projectPath). |
| **IDL from build** | Done | IDL in repo matches program; xtask can regenerate from source. |

---

## Quick reference

| Goal | CLI | MCP (Cursor) |
|------|-----|---------------|
| New program | `vara-mcp scaffold <name>` | “Scaffold a counter named X” → `vara_scaffold_program` |
| Build WASM | `vara-mcp compile [path]` | “Compile my_dapp” → `vara_compile` |
| Run tests | `vara-mcp test [path]` | “Run tests for my_dapp” → `vara_test` |
| TS client | `vara-mcp client [path]` | “Generate client for my_dapp” → `vara_client_scaffold` |
| Search docs | `vara-mcp search <query>` | “Search Vara docs for X” → `vara_docs_search` |

---

## License

MIT
