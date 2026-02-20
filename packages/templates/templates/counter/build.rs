use std::fs;
use std::path::Path;

fn main() {
    // Builds WASM and generates .wasm, .opt.wasm; we ensure .idl is copied next to them
    sails_rs::build_wasm();
    copy_idl_to_release();
}

/// Copy generated IDL so it sits next to .wasm and .opt.wasm in both:
/// - target/wasm32v1-none/release/
/// - target/wasm32v1-none/wasm32-gear/release/ (where .opt.wasm is)
fn copy_idl_to_release() {
    let target_dir = std::env::var("CARGO_TARGET_DIR").unwrap_or_else(|_| "target".to_string());
    let target_path = Path::new(&target_dir);
    let pkg_name = std::env::var("CARGO_PKG_NAME").unwrap();
    let idl_name = format!("{}.idl", pkg_name);

    // All release dirs where we want .idl to appear (next to .wasm / .opt.wasm)
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

    // 1) OUT_DIR (build script / macro output)
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

    // 2) wasm32v1-none/release/build/*/out/*.idl
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

    // 3) wasm32v1-none/wasm32-gear/release/build/*/out/*.idl (sails/gear output)
    let gear_build = target_path
        .join("wasm32v1-none")
        .join("wasm32-gear")
        .join("release")
        .join("build");
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

    // 4) wasm32v1-none/wasm-projects/.../build/*/out/*.idl (nested sails build)
    let wp_build = target_path
        .join("wasm32v1-none")
        .join("wasm-projects")
        .join("release");
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

    // 5) Fallback: no IDL was generated (e.g. single-crate template). Write minimal hex so
    //    .idl always exists next to .opt.wasm. Clients may need full IDL from sails-cli.
    let minimal_idl = "0x00";
    for dest_dir in &release_dirs {
        let _ = fs::create_dir_all(dest_dir);
        let dest = dest_dir.join(&idl_name);
        let _ = fs::write(&dest, minimal_idl);
    }
}
