use std::fs;
use std::path::Path;

fn main() {
    // Builds WASM and generates .wasm, .opt.wasm; we ensure .idl is copied to the same folder
    sails_rs::build_wasm();
    copy_idl_to_release();
}

/// Copy generated IDL into target/wasm32-gear/release/ so it sits next to .wasm and .opt.wasm
fn copy_idl_to_release() {
    let target_dir = std::env::var("CARGO_TARGET_DIR").unwrap_or_else(|_| "target".to_string());
    let pkg_name = std::env::var("CARGO_PKG_NAME").unwrap();
    let release_dir = Path::new(&target_dir).join("wasm32-gear").join("release");
    let out_dir = std::env::var("OUT_DIR").ok();

    // 1) Look in OUT_DIR (build script / macro output)
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

    // 2) Look under target/wasm32-gear/release/build/*/out/*.idl (target build OUT_DIR)
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
