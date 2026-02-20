# Troubleshooting Guide

This guide helps resolve common issues when using the Vara MCP server.

## Installation Issues

### pnpm install fails

**Symptom:** `pnpm install` shows errors about missing packages or versions.

**Solutions:**

1. Ensure you have pnpm 9.x installed:
   ```bash
   npm install -g pnpm@latest
   ```

2. Clear the cache and retry:
   ```bash
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

3. Check Node.js version (requires 18+):
   ```bash
   node --version
   ```

### Build fails

**Symptom:** `pnpm build` shows TypeScript errors.

**Solutions:**

1. Ensure all dependencies are installed:
   ```bash
   pnpm install
   ```

2. Check for TypeScript version mismatch:
   ```bash
   pnpm why typescript
   ```

3. Clean and rebuild:
   ```bash
   pnpm clean
   pnpm build
   ```

## Rust/Cargo Issues

### cargo not found

**Symptom:** `vara_compile` or `vara_test` fails with "cargo not found".

**Solution:** Install Rust via rustup:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### WASM target not installed

**Symptom:** Build fails with "can't find crate for 'core'" or "Rust target ... is not installed".

**Solution:** Add the Vara WASM target, then build:

```bash
rustup target add wasm32v1-none
cargo build --release   # output: target/wasm32v1-none/release/
```

### Sails CLI not found

**Symptom:** Scaffolding falls back to embedded template.

**Solution:** Install Sails CLI (optional):

```bash
cargo install sails-cli
```

Note: The embedded template works without Sails CLI.

### Build takes too long

**Symptom:** First compilation takes 5+ minutes.

**Explanation:** Rust compilation is slow, especially for WASM targets. Subsequent builds use cached dependencies.

**Solutions:**

1. Use `sccache` for faster rebuilds:
   ```bash
   cargo install sccache
   export RUSTC_WRAPPER=sccache
   ```

2. Build in release mode only when needed (debug is faster)

### Memory issues during build

**Symptom:** Build killed or OOM errors.

**Solutions:**

1. Close other applications
2. Increase swap space
3. Build with fewer parallel jobs:
   ```bash
   cargo build -j 2
   ```

## MCP Server Issues

### Server won't start

**Symptom:** Cursor shows "Server failed to start" or no connection.

**Diagnostic Steps:**

1. Test the server manually:
   ```bash
   node /path/to/vara-mcp/packages/server/dist/index.js
   ```
   
   If it starts without errors, the issue is in Cursor configuration.

2. Check the path in `.cursor/mcp.json` is absolute and correct

3. Enable debug mode:
   ```json
   {
     "env": {
       "VARA_DEBUG": "true"
     }
   }
   ```

### Tools not appearing

**Symptom:** Server connects but tools aren't listed.

**Solutions:**

1. Restart Cursor completely
2. Check Cursor's MCP panel for errors
3. Verify the server build is up to date:
   ```bash
   pnpm build
   ```

### Permission denied errors

**Symptom:** Operations fail with EACCES or permission errors.

**Solutions:**

1. Check workspace directory permissions:
   ```bash
   ls -la /path/to/workspace
   ```

2. Ensure Node.js can write to the workspace

3. On macOS, check Full Disk Access for Cursor in System Preferences

### Path security errors

**Symptom:** "Path is outside allowed root" error.

**Explanation:** The server restricts operations to the workspace root.

**Solutions:**

1. Ensure `VARA_WORKSPACE_ROOT` is set correctly
2. Use relative paths in tool calls
3. Don't try to access files outside your project

## Tool-Specific Issues

### vara_scaffold_program

**Issue:** "Directory already exists"

**Solution:** Use `force: true` to overwrite, or choose a different name.

**Issue:** "Invalid project name"

**Solution:** Use lowercase letters, numbers, underscores, or hyphens. Must start with a letter.

### vara_compile

**Issue:** "No Cargo.toml found"

**Solution:** Specify the correct `projectPath` relative to workspace root.

**Issue:** No WASM files in output

**Solution:** Check the build output for errors. The WASM is only generated for library crates with `crate-type = ["cdylib"]`.

### vara_test

**Issue:** Tests fail to run

**Solutions:**

1. Ensure test dependencies are in Cargo.toml
2. Check that gtest is properly configured
3. Run manually to see detailed errors:
   ```bash
   cd /path/to/project
   cargo test -- --nocapture
   ```

### vara_client_scaffold

**Issue:** Client generated without WASM/IDL paths

**Solution:** Build the program first with `vara_compile`, then scaffold the client.

### vara_docs_search

**Issue:** No results found

**Solutions:**

1. Try different search terms
2. Use keywords like "quickstart", "build", "deploy", "message"
3. Check the available resources for topics

## Network Issues (Future Deploy Feature)

### Connection timeout

**Symptom:** Deploy fails with timeout.

**Solutions:**

1. Check your internet connection
2. Verify the RPC endpoint is accessible:
   ```bash
   curl -I wss://testnet.vara.network
   ```
3. Try a different endpoint

### Insufficient balance

**Symptom:** Deploy fails with balance error.

**Solution:** Get testnet tokens from the [Vara faucet](https://idea.gear-tech.io/faucet).

## Getting Help

### Debug Information

When reporting issues, include:

1. Node.js version: `node --version`
2. pnpm version: `pnpm --version`
3. Rust version: `rustc --version`
4. OS and version
5. Contents of `.cursor/mcp.json` (remove secrets!)
6. Error messages and logs

### Enable Verbose Logging

```json
{
  "mcpServers": {
    "vara-mcp": {
      "env": {
        "VARA_DEBUG": "true"
      }
    }
  }
}
```

### Useful Commands

```bash
# Check Rust setup
rustup show

# List installed targets
rustup target list --installed

# Verify cargo-sails
cargo sails --help

# Test MCP server directly
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node packages/server/dist/index.js
```

### Community Resources

- [Vara Network Documentation](https://docs.vara.network/)
- [Sails Framework Docs](https://docs.gear.rs/sails/)
- [Gear Protocol Discord](https://discord.gg/gear-protocol)
