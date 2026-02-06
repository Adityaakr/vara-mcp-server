fn main() {
    // Builds WASM and always generates .wasm, .opt.wasm, and .idl in target/wasm32-gear/release/
    sails_rs::build_wasm();
}
