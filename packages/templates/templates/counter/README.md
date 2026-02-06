# {{PROJECT_NAME}}

A counter smart program for Vara Network built with Sails 0.10.

## Building

```bash
rustup target add wasm32v1-none
cargo build --release
```

Output: `target/wasm32-gear/release/` (`.wasm`, `.opt.wasm`, `.idl`)

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
