# Security Model

This document describes the security measures implemented in the Vara MCP server.

## Overview

The Vara MCP server is designed with a security-first approach:

1. **Command Allowlist** - Only specific commands can be executed
2. **Path Sandboxing** - File operations are restricted to the workspace
3. **No Shell Execution** - Commands are spawned directly, not through a shell
4. **No Secret Persistence** - Sensitive data is never written to disk

## Command Allowlist

### Allowed Commands

Only these commands can be executed by the server:

| Command | Allowed Subcommands | Notes |
|---------|---------------------|-------|
| `cargo` | `build`, `test`, `check`, `sails`, `clean`, `fmt`, `clippy` | Rust toolchain |
| `node` | (any) | Node.js runtime |
| `npm` | `init`, `install`, `run`, `test`, `pack` | Package manager |
| `pnpm` | `init`, `install`, `add`, `run`, `test`, `pack` | Package manager |
| `yarn` | `init`, `install`, `add`, `run`, `test`, `pack` | Package manager |
| `rustup` | `target`, `show`, `update` | Rust toolchain management |

### Blocked Patterns

Arguments are scanned for dangerous patterns:

- Shell metacharacters: `; & | \` $ ( )`
- Command substitution: `$()` and backticks
- Directory traversal: `../`
- Root redirects: `> /` and `< /`

### Implementation

```typescript
// From packages/runtime/src/exec.ts

// Commands are validated before execution
validateCommand(command, args);

// Processes are spawned WITHOUT shell
spawn(commandPath, args, {
  shell: false,  // CRITICAL: No shell interpretation
  // ...
});
```

## Path Sandboxing

### Workspace Root Enforcement

All file operations are constrained to the workspace root:

```typescript
// From packages/runtime/src/paths.ts

function resolveWithinRoot(root: string, inputPath: string): string {
  const resolvedPath = resolve(root, inputPath);
  
  // Check path doesn't escape root
  assertWithinRoot(root, resolvedPath);
  
  return resolvedPath;
}
```

### Blocked Operations

The following are blocked:

- Writing outside workspace root
- Reading outside workspace root (where applicable)
- Symlink attacks that escape the sandbox
- Path traversal using `../`

### Error Handling

Attempts to escape the sandbox result in clear errors:

```
PathViolationError: Path "/etc/passwd" is outside allowed root "/home/user/project"
```

## No Shell Execution

### Why This Matters

Shell execution allows command injection:

```bash
# Dangerous: shell interprets metacharacters
exec("cargo build; rm -rf /")  # BAD!

# Safe: arguments passed directly to process
spawn("cargo", ["build"])  # GOOD
```

### Implementation

The `safeSpawn` function:

1. Validates the command against the allowlist
2. Checks all arguments for dangerous patterns
3. Resolves the full command path (no PATH manipulation)
4. Spawns directly with `shell: false`

## Secret Handling

### Principles

1. **Read from Environment Only** - Secrets come from `process.env`
2. **Never Log Secrets** - Sensitive values are never logged
3. **Never Write Secrets** - No persistence to disk or config files
4. **Variable Names Only** - Tools accept env var names, not values

### Example: Deploy Tool

```typescript
// The tool accepts the NAME of the env var, not the value
vara_deploy(seedEnvVarName: "VARA_SEED", ...)

// Internally, it reads:
const seed = process.env[seedEnvVarName];

// The seed is NEVER:
// - Logged
// - Written to disk
// - Returned in responses
// - Stored in memory longer than needed
```

### User Responsibility

Users must:

1. Set secrets as environment variables
2. Never pass secrets as tool arguments
3. Secure their local environment

## Threat Model

### In Scope

| Threat | Mitigation |
|--------|------------|
| Command injection | Command allowlist + no shell |
| Path traversal | Sandbox enforcement |
| Secret leakage | No persistence, env-only |
| Arbitrary code execution | Allowlist restricts to dev tools |

### Out of Scope

| Threat | Reason |
|--------|--------|
| Malicious workspace content | User controls their workspace |
| Compromised system tools | System integrity assumed |
| Network attacks | Not a network server |
| Physical access | Local execution model |

## Audit Points

When auditing this codebase, focus on:

1. **`packages/runtime/src/exec.ts`** - Command execution
2. **`packages/runtime/src/paths.ts`** - Path sandboxing
3. **Tool handlers in `packages/server/src/tools/`** - Input validation

## Reporting Security Issues

If you find a security vulnerability:

1. **Do not** open a public issue
2. Email security@[project-domain] with details
3. Allow 90 days for a fix before disclosure

## Security Best Practices for Users

1. **Keep dependencies updated** - `pnpm update`
2. **Review workspace content** - Don't run on untrusted code
3. **Use environment variables** - Never hardcode secrets
4. **Restrict workspace scope** - Don't set root as workspace
5. **Monitor tool usage** - Enable debug logging in production
