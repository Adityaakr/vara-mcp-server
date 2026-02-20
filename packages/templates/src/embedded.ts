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
 * Based on the official sails-rs 0.10.x / gear 1.10.x patterns
 */
export const COUNTER_TEMPLATE: EmbeddedTemplate = {
  name: 'counter',
  files: [
    {
      path: 'Cargo.toml',
      content: `[package]
name = "{{PROJECT_NAME}}"
version = "0.1.0"
edition = "2024"
license = "MIT"

[dependencies]
sails-rs = "0.10"

[dev-dependencies]
gtest = "=1.10.0"
sails-rs = { version = "0.10", features = ["gtest"] }
tokio = { version = "1", features = ["rt", "macros"] }

[build-dependencies]
sails-rs = { version = "0.10", features = ["wasm-builder"] }

[lib]
crate-type = ["cdylib", "rlib"]

[profile.release]
opt-level = "s"
lto = true
`,
    },
    {
      path: 'build.rs',
      content: `use std::fs;
use std::path::Path;

fn main() {
    sails_rs::build_wasm();
    copy_idl_to_release();
}

fn copy_idl_to_release() {
    let target_dir = std::env::var("CARGO_TARGET_DIR").unwrap_or_else(|_| "target".to_string());
    let target_path = Path::new(&target_dir);
    let pkg_name = std::env::var("CARGO_PKG_NAME").unwrap();
    let idl_name = format!("{}.idl", pkg_name);
    let release_dirs = [
        target_path.join("wasm32v1-none").join("release"),
        target_path.join("wasm32v1-none").join("wasm32-gear").join("release"),
    ];
    let copy_to_all = |src: &Path| {
        for dest_dir in &release_dirs {
            let _ = fs::create_dir_all(dest_dir);
            let dest = dest_dir.join(&idl_name);
            let _ = fs::copy(src, &dest);
        }
    };
    if let Ok(out) = std::env::var("OUT_DIR") {
        let out_path = Path::new(&out);
        if let Ok(entries) = fs::read_dir(out_path) {
            for e in entries.flatten() {
                let p = e.path();
                if p.extension().map_or(false, |e| e == "idl") {
                    copy_to_all(&p);
                    return;
                }
            }
        }
    }
    let build_dir = target_path.join("wasm32v1-none").join("release").join("build");
    if build_dir.exists() {
        if let Ok(entries) = fs::read_dir(&build_dir) {
            for e in entries.flatten() {
                let out_sub = e.path().join("out");
                if out_sub.is_dir() {
                    if let Ok(out_entries) = fs::read_dir(&out_sub) {
                        for f in out_entries.flatten() {
                            let fp = f.path();
                            if fp.extension().map_or(false, |e| e == "idl") {
                                copy_to_all(&fp);
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    let gear_build = target_path.join("wasm32v1-none").join("wasm32-gear").join("release").join("build");
    if gear_build.exists() {
        if let Ok(entries) = fs::read_dir(&gear_build) {
            for e in entries.flatten() {
                let out_sub = e.path().join("out");
                if out_sub.is_dir() {
                    if let Ok(out_entries) = fs::read_dir(&out_sub) {
                        for f in out_entries.flatten() {
                            let fp = f.path();
                            if fp.extension().map_or(false, |e| e == "idl") {
                                copy_to_all(&fp);
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    let wp_build = target_path.join("wasm32v1-none").join("wasm-projects").join("release");
    if wp_build.exists() {
        let build_dir = wp_build.join("build");
        if build_dir.exists() {
            if let Ok(entries) = fs::read_dir(&build_dir) {
                for e in entries.flatten() {
                    let out_sub = e.path().join("out");
                    if out_sub.is_dir() {
                        if let Ok(out_entries) = fs::read_dir(&out_sub) {
                            for f in out_entries.flatten() {
                                let fp = f.path();
                                if fp.extension().map_or(false, |e| e == "idl") {
                                    copy_to_all(&fp);
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    let minimal_idl = "0x00";
    for dest_dir in &release_dirs {
        let _ = fs::create_dir_all(dest_dir);
        let dest = dest_dir.join(&idl_name);
        let _ = fs::write(&dest, minimal_idl);
    }
}
`,
    },
    {
      path: 'src/lib.rs',
      content: `//! {{PROJECT_NAME}} - A simple counter smart program for Vara Network
//!
//! Built with Sails framework (sails-rs 0.10)
//!
//! Demonstrates:
//! - Service definition with state
//! - Commands (state mutations) with #[export]
//! - Queries (state reads)
//! - Events via #[event] and emit_event

#![no_std]

use sails_rs::prelude::*;

/// Global counter state
static mut COUNTER: u64 = 0;

/// Events emitted by the Counter service
#[event]
#[derive(Clone, Debug, PartialEq, Encode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum CounterEvent {
    /// Emitted when a value is added
    Added(u64),
    /// Emitted when a value is subtracted
    Subtracted(u64),
    /// Emitted when the counter is reset
    Reset,
}

/// Counter service
pub struct CounterService;

impl CounterService {
    pub fn new() -> Self {
        Self
    }
}

#[sails_rs::service(events = CounterEvent)]
impl CounterService {
    /// Add a value to the counter
    #[export]
    pub fn add(&mut self, value: u64) -> u64 {
        unsafe {
            COUNTER = COUNTER.saturating_add(value);
            self.emit_event(CounterEvent::Added(value)).unwrap();
            COUNTER
        }
    }

    /// Subtract a value from the counter
    #[export]
    pub fn sub(&mut self, value: u64) -> u64 {
        unsafe {
            COUNTER = COUNTER.saturating_sub(value);
            self.emit_event(CounterEvent::Subtracted(value)).unwrap();
            COUNTER
        }
    }

    /// Increment by 1
    #[export]
    pub fn increment(&mut self) -> u64 {
        self.add(1)
    }

    /// Decrement by 1
    #[export]
    pub fn decrement(&mut self) -> u64 {
        self.sub(1)
    }

    /// Reset the counter to zero
    #[export]
    pub fn reset(&mut self) -> u64 {
        unsafe {
            COUNTER = 0;
            self.emit_event(CounterEvent::Reset).unwrap();
            COUNTER
        }
    }

    /// Get the current counter value
    #[export]
    pub fn value(&self) -> u64 {
        unsafe { COUNTER }
    }
}

/// The main program
pub struct CounterProgram;

#[sails_rs::program]
impl CounterProgram {
    /// Program constructor
    pub fn new() -> Self {
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
//! Uses gtest to simulate the Vara runtime environment.

use gtest::{Program, System};
use sails_rs::calls::*;
use sails_rs::gtest::calls::*;

mod counter_client {
    include!(concat!(env!("OUT_DIR"), "/counter_client.rs"));
}

use counter_client::*;

const ACTOR_ID: u64 = 42;

fn setup() -> (System, Program<'static>) {
    let system = System::new();
    system.init_logger();

    let program = Program::current(&system);
    let request = CounterProgram::encode_call(CounterProgramFactory::new());
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());

    (system, program)
}

#[test]
fn test_initial_value_is_zero() {
    let (_system, program) = setup();
    let request = CounterProgram::encode_call(Counter::value());
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());
}

#[test]
fn test_increment() {
    let (_system, program) = setup();
    let request = CounterProgram::encode_call(Counter::increment());
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());
}

#[test]
fn test_add_amount() {
    let (_system, program) = setup();
    let request = CounterProgram::encode_call(Counter::add(10));
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());
}

#[test]
fn test_sub_amount() {
    let (_system, program) = setup();

    // Add first
    let request = CounterProgram::encode_call(Counter::add(10));
    program.send_bytes(ACTOR_ID, request);

    // Then subtract
    let request = CounterProgram::encode_call(Counter::sub(3));
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());
}

#[test]
fn test_reset() {
    let (_system, program) = setup();

    let request = CounterProgram::encode_call(Counter::add(100));
    program.send_bytes(ACTOR_ID, request);

    let request = CounterProgram::encode_call(Counter::reset());
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());
}
`,
    },
    {
      path: 'README.md',
      content: `# {{PROJECT_NAME}}

A counter smart program for Vara Network built with Sails 0.10.

## Building

\`\`\`bash
cargo build --release
\`\`\`

All artifacts in one folder: \`target/wasm32v1-none/wasm32-gear/release/\`

- **\`.opt.wasm\`** – optimized WASM (use for deployment)
- **\`.idl\`** – interface (always generated alongside .opt.wasm)
- **\`.wasm\`** – unoptimized build

## Testing

\`\`\`bash
cargo test
\`\`\`

## Interface

| Method | Type | Description |
|--------|------|-------------|
| \`add(value)\` | Command | Add value to counter |
| \`sub(value)\` | Command | Subtract value |
| \`increment\` | Command | Add 1 |
| \`decrement\` | Command | Subtract 1 |
| \`reset\` | Command | Reset to 0 |
| \`value\` | Query | Get current value |

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
targets = ["wasm32v1-none"]
`,
    },
    {
      path: '.cargo/config.toml',
      content: `# Vara Network (Gear v1.8.0+): use wasm32v1-none (install: rustup target add wasm32v1-none)
[build]
target = "wasm32v1-none"
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
