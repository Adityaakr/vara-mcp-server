//! Generates the IDL file from the program definition.
//! Run with: cargo run -p xtask
//!
//! Builds for host (not wasm), generates my_dapp.idl with the full counter
//! interface so it matches the .opt.wasm for upload.

use std::env;
use std::path::PathBuf;

fn main() {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR");
    let project_root = PathBuf::from(&manifest_dir).parent().unwrap().to_path_buf();
    let target_dir = env::var("CARGO_TARGET_DIR")
        .unwrap_or_else(|_| project_root.join("target").to_string_lossy().to_string());
    let pkg_name = "my_dapp";
    let idl_name = format!("{}.idl", pkg_name);

    // Release output dirs (next to .opt.wasm)
    let release_dirs = [
        PathBuf::from(&target_dir)
            .join("wasm32v1-none")
            .join("release"),
        PathBuf::from(&target_dir)
            .join("wasm32v1-none")
            .join("wasm32-gear")
            .join("release"),
    ];

    let mut written = false;
    for dir in &release_dirs {
        std::fs::create_dir_all(dir).ok();
        let idl_path = dir.join(&idl_name);
        if let Err(e) = sails_rs::generate_idl_to_file::<my_dapp::CounterProgram>(&idl_path) {
            eprintln!("warning: Could not generate IDL at {:?}: {}", idl_path, e);
        } else {
            println!("Generated IDL: {}", idl_path.display());
            written = true;
        }
    }

    // Also write to project root
    let root_idl = project_root.join(&idl_name);
    if sails_rs::generate_idl_to_file::<my_dapp::CounterProgram>(&root_idl).is_ok() {
        println!("Generated IDL: {}", root_idl.display());
        written = true;
    }

    if !written {
        eprintln!("error: Failed to generate IDL");
        std::process::exit(1);
    }
}
