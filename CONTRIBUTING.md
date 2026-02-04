# Contributing to vara-mcp

Thank you for your interest in contributing to vara-mcp! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 9+
- Rust toolchain (for testing actual builds)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/vara-network/vara-mcp.git
cd vara-mcp

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Project Structure

```
vara-mcp/
├── packages/
│   ├── server/      # MCP server (main entry point)
│   ├── runtime/     # Safe execution utilities
│   ├── templates/   # Embedded program templates
│   └── chain/       # Gear-JS client generator
├── docs/            # Documentation
└── playground/      # Test projects (gitignored)
```

## Development Workflow

### Running in Development Mode

```bash
# Watch mode for all packages
pnpm dev

# Test the server
node packages/server/dist/index.js
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test packages/runtime/src/exec.test.ts
```

### Linting and Formatting

```bash
# Check linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

## Making Changes

### Adding a New Tool

1. Define the schema in `packages/server/src/tools/schemas.ts`
2. Implement the tool logic in `packages/server/src/tools/`
3. Register the tool in `packages/server/src/index.ts`
4. Add tests
5. Update documentation

### Adding a New Template

1. Create template directory in `packages/templates/templates/`
2. Add template info to `TEMPLATES` in `packages/templates/src/templates.ts`
3. Add tests
4. Update documentation

### Security Considerations

- Never add commands to the allowlist without careful review
- Ensure all file operations go through path sandboxing
- Never log or persist secrets
- Use `spawn` with `shell: false`, never `exec`

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`pnpm test`)
6. Ensure linting passes (`pnpm lint`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### PR Title Convention

Use conventional commits format:

- `feat: add new tool for X`
- `fix: handle edge case in Y`
- `docs: update setup instructions`
- `chore: update dependencies`
- `test: add tests for Z`

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## Questions?

Feel free to open an issue for questions or discussions.
