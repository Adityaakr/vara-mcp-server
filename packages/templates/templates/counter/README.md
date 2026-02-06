# {{PROJECT_NAME}}

A counter smart program for Vara Network built with Sails 0.10.

## Building

```bash
cargo build --release
```

After a successful build, your working directory will contain:

```
{{PROJECT_NAME}}/
├── ...
├── target/
│   ├── ...
│   └── wasm32-gear
│       └── release
│           ├── {{PROJECT_NAME}}.wasm       # Built .wasm file
│           ├── {{PROJECT_NAME}}.opt.wasm  # Optimized .wasm (upload to chain)
│           └── {{PROJECT_NAME}}.idl       # Application interface (IDL)
```

- **`.wasm`** – built WASM binary from source  
- **`.opt.wasm`** – optimized WASM (smaller, faster; use for deployment)  
- **`.idl`** – application interface (IDL), always generated; defines methods and types for clients

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
