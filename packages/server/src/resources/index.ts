/**
 * MCP Resources for Vara documentation
 */

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * Available resources
 */
export const RESOURCES: ResourceDefinition[] = [
  {
    uri: 'vara://docs/sails-quickstart',
    name: 'Vara Sails Quickstart',
    description: 'Getting started guide for building Vara programs with Sails',
    mimeType: 'text/markdown',
  },
  {
    uri: 'vara://docs/build-targets',
    name: 'Common Build Targets & Gotchas',
    description: 'Guide to building Vara programs for different targets and common issues',
    mimeType: 'text/markdown',
  },
  {
    uri: 'vara://docs/gear-js-basics',
    name: 'Gear-JS Interaction Basics',
    description: 'How to interact with Vara programs using the Gear-JS API',
    mimeType: 'text/markdown',
  },
];

/**
 * Resource content storage
 */
const RESOURCE_CONTENT: Record<string, string> = {
  'vara://docs/sails-quickstart': `# Vara Sails Quickstart

## Overview

Sails is a framework for building smart programs on the Vara Network. It provides a high-level, 
Rust-based abstraction over the low-level Gear Protocol, making it easier to write, test, and 
deploy smart programs.

## Prerequisites

Before you begin, ensure you have:

1. **Rust toolchain** installed via [rustup](https://rustup.rs/)
2. **Template** includes \`.cargo/config.toml\` so output goes to \`target/wasm32-gear/release/\` (no wasm32-unknown-unknown)
3. **Sails CLI** (optional): \`cargo install sails-cli\`

## Creating a New Program

### Using Sails CLI (Recommended)

\`\`\`bash
cargo sails new-program my-program
cd my-program
\`\`\`

### Manual Setup

Create a new Rust project with the following \`Cargo.toml\`:

\`\`\`toml
[package]
name = "my-program"
version = "0.1.0"
edition = "2024"

[dependencies]
sails-rs = "0.10"

[build-dependencies]
sails-rs = { version = "0.10", features = ["wasm-builder"] }

[lib]
crate-type = ["cdylib", "rlib"]
\`\`\`

And a \`rust-toolchain.toml\`:
\`\`\`toml
[toolchain]
channel = "stable"
targets = ["wasm32v1-none"]
\`\`\`

## Program Structure

### Service Definition

Services contain your business logic. Use \`#[export]\` to expose methods:

\`\`\`rust
#![no_std]
use sails_rs::prelude::*;

pub struct MyService;

#[sails_rs::service]
impl MyService {
    // Commands mutate state
    #[export]
    pub fn do_action(&mut self, input: u32) -> u32 {
        input * 2
    }
    
    // Queries read state
    #[export]
    pub fn get_value(&self) -> u32 {
        42
    }
}
\`\`\`

### Program Definition

The program is the entry point:

\`\`\`rust
pub struct MyProgram;

#[sails_rs::program]
impl MyProgram {
    pub fn new() -> Self {
        Self
    }
    
    pub fn my_service(&self) -> MyService {
        MyService::new()
    }
}
\`\`\`

## Building

\`\`\`bash
# Debug build
cargo build

# Release build (optimized)
cargo build --release
\`\`\`

## Testing

Add tests in \`tests/\` directory:

\`\`\`rust
use gtest::{Program, System};

#[test]
fn test_my_program() {
    let system = System::new();
    let program = Program::current(&system);
    // Test your program
}
\`\`\`

Run tests:

\`\`\`bash
cargo test
\`\`\`

## Next Steps

1. Check out the [Sails documentation](https://docs.gear.rs/sails/)
2. Explore [Vara examples](https://github.com/gear-foundation/dapps)
3. Deploy to [Vara testnet](https://idea.gear-tech.io/)
`,

  'vara://docs/build-targets': `# Common Build Targets & Gotchas

## Build Targets

### Output: target/wasm32-gear/ only (no wasm32-unknown-unknown)

The scaffold includes \`.cargo/config.toml\` and \`.cargo/wasm32-gear.json\`, so build output goes only to \`target/wasm32-gear/release/\` with \`.wasm\`, \`.opt.wasm\`, and \`.idl\` always generated.

### Build Commands

\`\`\`bash
# Debug build (faster, larger output)
cargo build

# Release build (optimized, smaller output)
cargo build --release
\`\`\`

### Output Locations

Build output goes to \`target/wasm32-gear/\` (.wasm, .opt.wasm, .idl always generated):

\`\`\`
target/wasm32-gear/release/
├── my_program.wasm       # Built WASM file
├── my_program.opt.wasm   # Optimized WASM (use for deployment)
└── my_program.idl        # Application interface (IDL), always generated
\`\`\`

| Build Type | Location |
|------------|----------|
| Debug | \`target/wasm32-gear/debug/\` |
| Release | \`target/wasm32-gear/release/\` |

## Common Issues & Solutions

### Target Not Installed

**Error:**
\`\`\`
error[E0463]: can't find crate for 'std'
\`\`\`

**Solution:** Use the scaffolded template (it includes \`.cargo/wasm32-gear.json\`). Then \`cargo build --release\` outputs to \`target/wasm32-gear/release/\` with no wasm32-unknown-unknown.

### Missing sails-rs Crate

**Error:**
\`\`\`
error[E0432]: unresolved import 'sails_rs'
\`\`\`

**Solution:** Add to Cargo.toml:
\`\`\`toml
[dependencies]
sails-rs = "0.10"
\`\`\`

### Build Script Errors

**Error:**
\`\`\`
error: build script failed
\`\`\`

**Solution:** Ensure build.rs contains:
\`\`\`rust
fn main() {
    sails_rs::build_wasm();
}
\`\`\`

### WASM File Too Large

**Solution:** Add to Cargo.toml:
\`\`\`toml
[profile.release]
opt-level = "s"  # or "z" for even smaller
lto = true
codegen-units = 1
\`\`\`

### Linker Errors

**Error:**
\`\`\`
wasm-ld: error: initial memory too small
\`\`\`

**Solution:** The program may be using too much static memory. Review global state usage.

## Optimization Tips

1. **Use release mode** for deployment
2. **Enable LTO** (Link-Time Optimization)
3. **Minimize dependencies** - each adds to WASM size
4. **Avoid large static allocations**

## IDL Generation

The IDL file is generated automatically during build in the same output directory:
\`\`\`
target/wasm32-gear/release/my_program.idl
\`\`\`

This file describes your program's interface and is needed for client generation.
`,

  'vara://docs/gear-js-basics': `# Gear-JS Interaction Basics

## Overview

Gear-JS is the JavaScript/TypeScript SDK for interacting with the Vara Network.

## Installation

\`\`\`bash
npm install @gear-js/api @polkadot/api
\`\`\`

## Connecting to a Node

\`\`\`typescript
import { GearApi } from '@gear-js/api';

// Connect to testnet
const api = await GearApi.create({
  providerAddress: 'wss://testnet.vara.network'
});

console.log('Connected!');
console.log('Genesis:', api.genesisHash.toHex());
\`\`\`

### Network Endpoints

| Network | Endpoint |
|---------|----------|
| Testnet | \`wss://testnet.vara.network\` |
| Mainnet | \`wss://rpc.vara.network\` |

## Account Management

### Creating a Keyring

\`\`\`typescript
import { GearKeyring } from '@gear-js/api';

// From seed phrase (NEVER hardcode in production!)
const keyring = await GearKeyring.fromSuri(process.env.SEED_PHRASE);
console.log('Address:', keyring.address);

// From JSON backup
const keyring = GearKeyring.fromJson(jsonBackup, password);
\`\`\`

## Uploading Programs

\`\`\`typescript
import { readFileSync } from 'fs';

// Read WASM file
const code = readFileSync('./path/to/program.opt.wasm');

// Calculate gas
const gas = await api.program.calculateGas.initUpload(
  keyring.address,
  code,
  initPayload,  // Initial message payload
  0             // Value to send
);

// Upload
const { programId, extrinsic } = api.program.upload({
  code,
  gasLimit: gas.min_limit,
  initPayload,
});

await extrinsic.signAndSend(keyring, (result) => {
  if (result.status.isFinalized) {
    console.log('Program ID:', programId);
  }
});
\`\`\`

## Sending Messages

\`\`\`typescript
// Calculate gas
const gas = await api.program.calculateGas.handle(
  keyring.address,
  programId,
  payload,
  0
);

// Send message
const extrinsic = api.message.send({
  destination: programId,
  payload,
  gasLimit: gas.min_limit,
  value: 0,
});

await extrinsic.signAndSend(keyring, (result) => {
  if (result.status.isFinalized) {
    console.log('Message sent!');
  }
});
\`\`\`

## Reading State

\`\`\`typescript
// Read full state
const state = await api.programState.read({
  programId,
  payload: null
}, metadata);

console.log('State:', state.toJSON());
\`\`\`

## Working with Metadata

\`\`\`typescript
import { ProgramMetadata } from '@gear-js/api';

// Load from IDL file
const idl = readFileSync('./path/to/program.idl', 'utf-8');
const metadata = ProgramMetadata.from(idl);

// Use metadata for encoding/decoding
const encoded = metadata.createType('Input', { SomeCommand: { value: 42 } });
\`\`\`

## Event Subscription

\`\`\`typescript
api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data }) => {
  const { message } = data;
  console.log('Message received:', message.payload.toHuman());
});
\`\`\`

## Error Handling

\`\`\`typescript
try {
  await extrinsic.signAndSend(keyring, (result) => {
    if (result.status.isFinalized) {
      const failed = result.events.find(
        ({ event }) => api.events.system.ExtrinsicFailed.is(event)
      );
      if (failed) {
        const [error] = failed.event.data;
        console.error('Transaction failed:', error.toHuman());
      }
    }
  });
} catch (error) {
  console.error('Error:', error);
}
\`\`\`

## Security Best Practices

1. **Never hardcode seed phrases** - Use environment variables
2. **Validate all user input** before sending to chain
3. **Handle errors gracefully** - Network issues are common
4. **Test on testnet first** - Mainnet transactions cost real tokens
`,
};

/**
 * Get all resource definitions
 */
export function getResourceDefinitions(): ResourceDefinition[] {
  return RESOURCES;
}

/**
 * Get content for a specific resource
 */
export function getResourceContent(uri: string): string | null {
  return RESOURCE_CONTENT[uri] ?? null;
}
