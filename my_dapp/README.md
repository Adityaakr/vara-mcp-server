# my_dapp

A counter smart program for Vara Network built with Sails 0.10.

## Building

```bash
cargo build --release
```

All artifacts in one folder: `target/wasm32v1-none/wasm32-gear/release/`

- **`.opt.wasm`** – optimized WASM (use for deployment)
- **`.idl`** – interface definition (constructors, service, commands, queries, events) – matches the program for upload
- **`.wasm`** – unoptimized build

The IDL is copied from `idl/my_dapp.idl` during build. It describes the Counter service so upload tools (Gear IDEA, sails-js, etc.) can encode/decode payloads correctly.

## Testing

```bash
cargo test
```

## Interface

| Method | Type | Description |
|--------|------|-------------|
| `add(value)` | Command | Add value to counter |
| `sub(value)` | Command | Subtract value |
| `increment` | Command | Add 1 |
| `decrement` | Command | Subtract 1 |
| `reset` | Command | Reset to 0 |
| `value` | Query | Get current value |

## License

MIT
