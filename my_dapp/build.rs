use std::env;
use std::fs;
use std::path::Path;

fn main() {
    sails_rs::build_wasm();
    copy_idl_to_release();
}

fn copy_idl_to_release() {
    let target_dir = env::var("CARGO_TARGET_DIR").unwrap_or_else(|_| "target".to_string());
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let target_path = Path::new(&target_dir);
    let pkg_name = env::var("CARGO_PKG_NAME").unwrap();
    let idl_name = format!("{}.idl", pkg_name);
    let release_dirs = [
        target_path.join("wasm32v1-none").join("release"),
        target_path.join("wasm32v1-none").join("wasm32-gear").join("release"),
    ];

    let copy_to_all = |src: &Path| {
        for dest_dir in &release_dirs {
            let _ = fs::create_dir_all(dest_dir);
            let dest = dest_dir.join(&idl_name);
            if src != dest {
                let _ = fs::copy(src, &dest);
            }
        }
    };

    let mut found = false;

    // 1. Use embedded IDL (matches Counter service, constructors, events)
    let idl_dir = Path::new(&manifest_dir).join("idl");
    let embedded_idl = idl_dir.join(&idl_name);
    if embedded_idl.exists() {
        let content = fs::read_to_string(&embedded_idl).unwrap_or_default();
        if !content.is_empty() && !content.trim().is_empty() {
            copy_to_all(&embedded_idl);
            found = true;
        }
    }

    // 3. Check manifest dir (idl_gen or xtask writes here)
    if !found {
        let root_idl = Path::new(&manifest_dir).join(&idl_name);
        if root_idl.exists() {
            let content = fs::read_to_string(&root_idl).unwrap_or_default();
            if !content.is_empty() && content != "0x00" {
                copy_to_all(&root_idl);
                found = true;
            }
        }
    }

    if !found {
        for dir in &release_dirs {
            let idl_path = dir.join(&idl_name);
            if idl_path.exists() {
                let content = fs::read_to_string(&idl_path).unwrap_or_default();
                if !content.is_empty() && content != "0x00" {
                    copy_to_all(&idl_path);
                    found = true;
                    break;
                }
            }
        }
    }

    // 5. OUT_DIR
    if !found {
        if let Ok(out) = env::var("OUT_DIR") {
            let out_path = Path::new(&out);
            if let Ok(entries) = fs::read_dir(out_path) {
                for e in entries.flatten() {
                    let p = e.path();
                    if p.extension().map_or(false, |e| e == "idl") {
                        copy_to_all(&p);
                        found = true;
                        break;
                    }
                }
            }
        }
    }

    // 6. Build output dirs
    if !found {
        for (build_sub, out_sub) in [
            (target_path.join("wasm32v1-none").join("release").join("build"), "out"),
            (
                target_path
                    .join("wasm32v1-none")
                    .join("wasm32-gear")
                    .join("release")
                    .join("build"),
                "out",
            ),
            (
                target_path
                    .join("wasm32v1-none")
                    .join("wasm-projects")
                    .join("release")
                    .join("build"),
                "out",
            ),
        ] {
            if build_sub.exists() {
                if let Ok(entries) = fs::read_dir(&build_sub) {
                    for e in entries.flatten() {
                        let out_dir = e.path().join(out_sub);
                        if out_dir.is_dir() {
                            if let Ok(out_entries) = fs::read_dir(&out_dir) {
                                for f in out_entries.flatten() {
                                    let fp = f.path();
                                    if fp.extension().map_or(false, |e| e == "idl") {
                                        let content = fs::read_to_string(&fp).unwrap_or_default();
                                        if !content.is_empty() && content != "0x00" {
                                            copy_to_all(&fp);
                                            found = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        if found {
                            break;
                        }
                    }
                }
            }
            if found {
                break;
            }
        }
    }

    if !found {
        eprintln!(
            "warning: No valid IDL found. Ensure idl/my_dapp.idl exists or run \
             'cargo run -p xtask --release --target <host>' to generate."
        );
        // Fallback: write minimal hex only if nothing exists (for compatibility)
        for dest_dir in &release_dirs {
            let dest = dest_dir.join(&idl_name);
            if !dest.exists() {
                let _ = fs::create_dir_all(dest_dir);
                let _ = fs::write(&dest, "0x00");
            }
        }
    }
}
