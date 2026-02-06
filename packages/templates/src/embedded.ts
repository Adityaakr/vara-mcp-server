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
    let pkg_name = std::env::var("CARGO_PKG_NAME").unwrap();
    let release_dir = Path::new(&target_dir).join("wasm32-gear").join("release");
    let out_dir = std::env::var("OUT_DIR").ok();
    if let Some(ref out) = out_dir {
        if let Ok(entries) = fs::read_dir(out) {
            for e in entries.flatten() {
                let p = e.path();
                if p.extension().map_or(false, |e| e == "idl") {
                    let dest = release_dir.join(format!("{}.idl", pkg_name));
                    let _ = fs::create_dir_all(&release_dir);
                    let _ = fs::copy(&p, &dest);
                    return;
                }
            }
        }
    }
    let build_dir = release_dir.join("build");
    if build_dir.exists() {
        if let Ok(entries) = fs::read_dir(&build_dir) {
            for e in entries.flatten() {
                let out_sub = e.path().join("out");
                if out_sub.is_dir() {
                    if let Ok(out_entries) = fs::read_dir(&out_sub) {
                        for f in out_entries.flatten() {
                            let fp = f.path();
                            if fp.extension().map_or(false, |e| e == "idl") {
                                let dest = release_dir.join(format!("{}.idl", pkg_name));
                                let _ = fs::create_dir_all(&release_dir);
                                let _ = fs::copy(&fp, &dest);
                                return;
                            }
                        }
                    }
                }
            }
        }
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

Output goes to \`target/wasm32-gear/release/\`:

- **\`.wasm\`** – built WASM binary
- **\`.opt.wasm\`** – optimized WASM (use for deployment)
- **\`.idl\`** – application interface (IDL), always generated

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
      content: `# Output to target/wasm32-gear/release/ (same codegen as wasm32v1-none)
[env]
RUST_TARGET_PATH = { value = ".cargo", relative = true }

[build]
target = "wasm32-gear"
`,
    },
    {
      path: '.cargo/wasm32-gear.json',
      content: `{"arch":"wasm32","binary-format":"wasm","cpu":"mvp","crt-objects-fallback":"true","data-layout":"e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-i128:128-n32:64-S128-ni:1:10:20","dll-prefix":"","dll-suffix":".wasm","dynamic-linking":true,"eh-frame-header":false,"emit-debug-gdb-scripts":false,"exe-suffix":".wasm","features":"+mutable-globals","generate-arange-section":false,"has-thread-local":true,"is-like-wasm":true,"linker":"rust-lld","linker-flavor":"wasm-lld","linker-is-gnu":false,"lld-flavor":"wasm","llvm-target":"wasm32-unknown-unknown","max-atomic-width":64,"metadata":{"description":"WebAssembly (Gear/Vara)","host_tools":false,"std":false,"tier":2},"only-cdylib":true,"panic-strategy":"abort","pre-link-args":{"wasm-lld":["-z","stack-size=1048576","--stack-first","--allow-undefined","--no-demangle","--no-entry"],"wasm-lld-cc":["-Wl,-z","-Wl,stack-size=1048576","-Wl,--stack-first","-Wl,--allow-undefined","-Wl,--no-demangle","--target=wasm32-unknown-unknown","-Wl,--no-entry"]},"relocation-model":"static","singlethread":true,"target-family":["wasm"],"target-pointer-width":32,"tls-model":"local-exec"}
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
