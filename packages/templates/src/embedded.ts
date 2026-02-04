/**
 * Embedded templates for vara-mcp
 * 
 * These templates are embedded as strings so they work when bundled.
 */

export interface EmbeddedFile {
  path: string;
  content: string;
}

export interface EmbeddedTemplate {
  name: string;
  files: EmbeddedFile[];
}

/**
 * Counter template - A simple counter smart program
 */
export const COUNTER_TEMPLATE: EmbeddedTemplate = {
  name: 'counter',
  files: [
    {
      path: 'Cargo.toml',
      content: `[package]
name = "{{PROJECT_NAME}}"
version = "0.1.0"
edition = "2021"
license = "MIT"

[dependencies]
sails-rs = "0.6"
gstd = "1.6"
parity-scale-codec = { version = "3.6", default-features = false, features = ["derive"] }
scale-info = { version = "2.11", default-features = false, features = ["derive"] }

[dev-dependencies]
gtest = "1.6"
sails-rs = { version = "0.6", features = ["gtest"] }
tokio = { version = "1", features = ["full"] }

[build-dependencies]
sails-rs = { version = "0.6", features = ["wasm-builder"] }

[lib]
crate-type = ["cdylib", "rlib"]

[features]
default = []

[profile.release]
opt-level = "s"
lto = true
`,
    },
    {
      path: 'build.rs',
      content: `//! Build script for the counter program
//!
//! This uses sails-rs wasm-builder to compile the program to WASM
//! and generate the IDL file.

fn main() {
    sails_rs::build_wasm();
}
`,
    },
    {
      path: 'src/lib.rs',
      content: `//! {{PROJECT_NAME}} - A simple counter smart program for Vara Network
//!
//! This program demonstrates basic Sails patterns:
//! - Service definition with state
//! - Commands (state mutations)
//! - Queries (state reads)
//! - Events

#![no_std]

use sails_rs::prelude::*;

/// Counter service state
static mut COUNTER_STATE: Option<CounterState> = None;

/// Internal state structure
#[derive(Default)]
struct CounterState {
    value: i64,
    owner: ActorId,
}

/// The Counter service provides increment/decrement operations
/// with query capabilities
#[derive(Default)]
pub struct CounterService;

/// Events emitted by the Counter service
#[derive(Debug, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum CounterEvent {
    /// Emitted when the counter value changes
    ValueChanged { old_value: i64, new_value: i64 },
    /// Emitted when the counter is reset
    Reset { by: ActorId },
}

#[sails_rs::service(events = CounterEvent)]
impl CounterService {
    /// Create a new counter service instance
    pub fn new() -> Self {
        Self
    }

    /// Initialize the counter state (called once at program init)
    pub fn init(&mut self) {
        unsafe {
            COUNTER_STATE = Some(CounterState {
                value: 0,
                owner: gstd::msg::source(),
            });
        }
    }

    /// Increment the counter by 1
    /// Returns the new value
    pub fn increment(&mut self) -> i64 {
        let (old_value, new_value) = {
            let state = self.state_mut();
            let old = state.value;
            state.value = state.value.saturating_add(1);
            (old, state.value)
        };
        
        self.notify_on(CounterEvent::ValueChanged {
            old_value,
            new_value,
        })
        .expect("Failed to emit event");
        
        new_value
    }

    /// Decrement the counter by 1
    /// Returns the new value
    pub fn decrement(&mut self) -> i64 {
        let (old_value, new_value) = {
            let state = self.state_mut();
            let old = state.value;
            state.value = state.value.saturating_sub(1);
            (old, state.value)
        };
        
        self.notify_on(CounterEvent::ValueChanged {
            old_value,
            new_value,
        })
        .expect("Failed to emit event");
        
        new_value
    }

    /// Add a specific amount to the counter
    /// Returns the new value
    pub fn add(&mut self, amount: i64) -> i64 {
        let (old_value, new_value) = {
            let state = self.state_mut();
            let old = state.value;
            state.value = state.value.saturating_add(amount);
            (old, state.value)
        };
        
        self.notify_on(CounterEvent::ValueChanged {
            old_value,
            new_value,
        })
        .expect("Failed to emit event");
        
        new_value
    }

    /// Reset the counter to zero (only owner can do this)
    pub fn reset(&mut self) -> Result<i64, &'static str> {
        let caller = gstd::msg::source();
        
        let old_value = {
            let state = self.state_mut();
            if caller != state.owner {
                return Err("Only owner can reset the counter");
            }
            let old = state.value;
            state.value = 0;
            old
        };
        
        self.notify_on(CounterEvent::Reset { by: caller })
            .expect("Failed to emit event");
        self.notify_on(CounterEvent::ValueChanged {
            old_value,
            new_value: 0,
        })
        .expect("Failed to emit event");
        
        Ok(0)
    }

    /// Query the current counter value
    pub fn value(&self) -> i64 {
        self.state().value
    }

    /// Query the owner of this counter
    pub fn owner(&self) -> ActorId {
        self.state().owner
    }

    /// Internal helper to get immutable state
    fn state(&self) -> &CounterState {
        unsafe { COUNTER_STATE.as_ref().expect("State not initialized") }
    }

    /// Internal helper to get mutable state
    fn state_mut(&mut self) -> &mut CounterState {
        unsafe { COUNTER_STATE.as_mut().expect("State not initialized") }
    }
}

/// The main program structure
pub struct CounterProgram;

#[sails_rs::program]
impl CounterProgram {
    /// Program constructor - initializes the counter
    pub fn new() -> Self {
        let mut service = CounterService::new();
        service.init();
        Self
    }

    /// Expose the counter service
    pub fn counter(&self) -> CounterService {
        CounterService::new()
    }
}
`,
    },
    {
      path: 'tests/counter_test.rs',
      content: `//! Tests for the Counter program
//!
//! These tests use gtest to simulate the Vara runtime environment.

use gtest::{Log, Program, System};
use sails_rs::calls::*;
use sails_rs::gtest::calls::*;

// Import the program module
mod counter_client {
    include!(concat!(env!("OUT_DIR"), "/counter_client.rs"));
}

use counter_client::*;

const ACTOR_ID: u64 = 42;

/// Helper to initialize the test system and deploy the program
fn setup() -> (System, Program<'static>) {
    let system = System::new();
    system.init_logger();
    
    // Create program from the WASM file
    let program = Program::current(&system);
    
    // Initialize the program
    let request = CounterProgram::encode_call(CounterProgramFactory::new());
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());
    
    (system, program)
}

#[test]
fn test_initial_value_is_zero() {
    let (_system, program) = setup();
    
    // Query the initial value
    let request = CounterProgram::encode_call(Counter::value());
    let result = program.send_bytes(ACTOR_ID, request);
    
    assert!(!result.main_failed());
    // The value should be 0
}

#[test]
fn test_increment() {
    let (_system, program) = setup();
    
    // Increment the counter
    let request = CounterProgram::encode_call(Counter::increment());
    let result = program.send_bytes(ACTOR_ID, request);
    
    assert!(!result.main_failed());
    
    // Query the value - should be 1
    let request = CounterProgram::encode_call(Counter::value());
    let result = program.send_bytes(ACTOR_ID, request);
    
    assert!(!result.main_failed());
}

#[test]
fn test_decrement() {
    let (_system, program) = setup();
    
    // First increment
    let request = CounterProgram::encode_call(Counter::increment());
    program.send_bytes(ACTOR_ID, request);
    
    // Then decrement
    let request = CounterProgram::encode_call(Counter::decrement());
    let result = program.send_bytes(ACTOR_ID, request);
    
    assert!(!result.main_failed());
}

#[test]
fn test_add_amount() {
    let (_system, program) = setup();
    
    // Add 10 to the counter
    let request = CounterProgram::encode_call(Counter::add(10));
    let result = program.send_bytes(ACTOR_ID, request);
    
    assert!(!result.main_failed());
}

#[test]
fn test_reset_by_owner() {
    let (_system, program) = setup();
    
    // Add some value
    let request = CounterProgram::encode_call(Counter::add(100));
    program.send_bytes(ACTOR_ID, request);
    
    // Reset (as owner)
    let request = CounterProgram::encode_call(Counter::reset());
    let result = program.send_bytes(ACTOR_ID, request);
    
    assert!(!result.main_failed());
}

#[test]
fn test_reset_by_non_owner_fails() {
    let (_system, program) = setup();
    
    const OTHER_ACTOR: u64 = 99;
    
    // Add some value as owner
    let request = CounterProgram::encode_call(Counter::add(100));
    program.send_bytes(ACTOR_ID, request);
    
    // Try to reset as non-owner
    let request = CounterProgram::encode_call(Counter::reset());
    let result = program.send_bytes(OTHER_ACTOR, request);
    
    // This should return an error result (not fail, but contain error)
    assert!(!result.main_failed());
}
`,
    },
    {
      path: 'README.md',
      content: `# {{PROJECT_NAME}}

A simple counter smart program for Vara Network built with Sails.

## Overview

This program demonstrates basic Sails patterns:

- **Service definition** with state management
- **Commands** (state mutations): \`increment\`, \`decrement\`, \`add\`, \`reset\`
- **Queries** (state reads): \`value\`, \`owner\`
- **Events**: \`ValueChanged\`, \`Reset\`

## Building

### Prerequisites

1. **Rust toolchain** with the \`wasm32-unknown-unknown\` target:
   \`\`\`bash
   rustup target add wasm32-unknown-unknown
   \`\`\`

2. **Sails CLI** (optional but recommended):
   \`\`\`bash
   cargo install sails-cli
   \`\`\`

### Build Commands

Build in debug mode:
\`\`\`bash
cargo build
\`\`\`

Build in release mode (optimized WASM):
\`\`\`bash
cargo build --release
\`\`\`

The WASM file will be output to:
- Debug: \`target/wasm32-unknown-unknown/debug/{{PROJECT_NAME}}.wasm\`
- Release: \`target/wasm32-unknown-unknown/release/{{PROJECT_NAME}}.opt.wasm\`

The IDL file will be generated at:
- \`target/wasm32-unknown-unknown/{debug|release}/{{PROJECT_NAME}}.idl\`

## Testing

Run the tests:
\`\`\`bash
cargo test
\`\`\`

## Program Interface

### Commands (mutate state)

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| \`increment\` | none | \`i64\` | Adds 1 to counter |
| \`decrement\` | none | \`i64\` | Subtracts 1 from counter |
| \`add\` | \`amount: i64\` | \`i64\` | Adds amount to counter |
| \`reset\` | none | \`Result<i64, &str>\` | Resets to 0 (owner only) |

### Queries (read state)

| Method | Returns | Description |
|--------|---------|-------------|
| \`value\` | \`i64\` | Current counter value |
| \`owner\` | \`ActorId\` | Program owner address |

### Events

| Event | Fields | Description |
|-------|--------|-------------|
| \`ValueChanged\` | \`old_value\`, \`new_value\` | Emitted on value change |
| \`Reset\` | \`by\` | Emitted on counter reset |

## Deployment

1. Upload the \`.wasm\` file to the Vara network using:
   - [Gear IDEA](https://idea.gear-tech.io/)
   - [gear-js](https://github.com/gear-tech/gear-js)
   - Your generated TypeScript client

2. The program will be initialized when you send the first message.

## License

MIT
`,
    },
    {
      path: '.gitignore',
      content: `# Generated files
/target/
Cargo.lock

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
`,
    },
    {
      path: 'rust-toolchain.toml',
      content: `[toolchain]
channel = "stable"
targets = ["wasm32-unknown-unknown"]
profile = "minimal"
`,
    },
  ],
};

/**
 * All embedded templates
 */
export const EMBEDDED_TEMPLATES: Record<string, EmbeddedTemplate> = {
  counter: COUNTER_TEMPLATE,
};

/**
 * Get embedded template by name
 */
export function getEmbeddedTemplate(name: string): EmbeddedTemplate | undefined {
  return EMBEDDED_TEMPLATES[name];
}

/**
 * Get all available embedded template names
 */
export function getEmbeddedTemplateNames(): string[] {
  return Object.keys(EMBEDDED_TEMPLATES);
}
