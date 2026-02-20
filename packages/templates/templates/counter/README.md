# {{PROJECT_NAME}}

A counter smart program for Vara Network built with Sails 0.10.

## Building

```bash
cargo build --release
```

After a successful build, **all artifacts are in one folder**:

```
target/wasm32v1-none/wasm32-gear/release/
├── {{PROJECT_NAME}}.wasm       # Built .wasm
├── {{PROJECT_NAME}}.opt.wasm   # Optimized (use for deployment)
└── {{PROJECT_NAME}}.idl        # Interface (always generated)
```

- **`.opt.wasm`** – optimized WASM; upload this to the chain  
- **`.idl`** – application interface; always generated alongside .opt.wasm  
- **`.wasm`** – unoptimized build

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
