# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-XX-XX

### Added

- Initial release
- **Tools:**
  - `vara_scaffold_program` - Create new Vara programs from templates
  - `vara_compile` - Compile programs to WASM
  - `vara_test` - Run program tests
  - `vara_client_scaffold` - Generate TypeScript clients
  - `vara_docs_search` - Search bundled documentation
- **Prompts:**
  - `create-vara-mvp` - Full workflow automation
  - `add-feature-to-program` - Feature guidance
- **Resources:**
  - Vara Sails Quickstart guide
  - Build Targets & Gotchas guide
  - Gear-JS Interaction Basics guide
- **Templates:**
  - Counter program template with events
- **Security:**
  - Command allowlist
  - Path sandboxing
  - No shell execution
- **Documentation:**
  - Cursor setup guide
  - Security model documentation
  - Troubleshooting guide

### Security

- Implemented strict command allowlist (cargo, node, npm/pnpm/yarn, rustup only)
- All file operations sandboxed to workspace root
- No arbitrary shell execution (spawn with shell: false)
- Secrets read from environment only, never persisted
