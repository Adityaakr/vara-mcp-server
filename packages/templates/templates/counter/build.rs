//! Build script for the counter program
//!
//! This uses sails-rs wasm-builder to compile the program to WASM
//! and generate the IDL file.

fn main() {
    sails_rs::build_wasm();
}
