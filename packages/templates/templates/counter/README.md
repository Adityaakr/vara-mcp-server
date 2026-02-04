# {{PROJECT_NAME}}

A simple counter smart program for Vara Network built with Sails.

## Overview

This program demonstrates basic Sails patterns:

- **Service definition** with state management
- **Commands** (state mutations): `increment`, `decrement`, `add`, `reset`
- **Queries** (state reads): `value`, `owner`
- **Events**: `ValueChanged`, `Reset`

## Building

### Prerequisites

1. **Rust toolchain** with the `wasm32v1-none` target:
   ```bash
   rustup target add wasm32v1-none
   ```

2. **Sails CLI** (optional but recommended):
   ```bash
   cargo install sails-cli
   ```

### Build Commands

Build in debug mode:
```bash
cargo build
```

Build in release mode (optimized WASM):
```bash
cargo build --release
```

The build output will be in `target/wasm32-gear/release/`:
```
target/wasm32-gear/release/
├── {{PROJECT_NAME}}.wasm       # Built WASM file
├── {{PROJECT_NAME}}.opt.wasm   # Optimized WASM file
└── {{PROJECT_NAME}}.idl        # Application interface IDL file
```

## Testing

Run the tests:
```bash
cargo test
```

## Program Interface

### Commands (mutate state)

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `increment` | none | `i64` | Adds 1 to counter |
| `decrement` | none | `i64` | Subtracts 1 from counter |
| `add` | `amount: i64` | `i64` | Adds amount to counter |
| `reset` | none | `Result<i64, &str>` | Resets to 0 (owner only) |

### Queries (read state)

| Method | Returns | Description |
|--------|---------|-------------|
| `value` | `i64` | Current counter value |
| `owner` | `ActorId` | Program owner address |

### Events

| Event | Fields | Description |
|-------|--------|-------------|
| `ValueChanged` | `old_value`, `new_value` | Emitted on value change |
| `Reset` | `by` | Emitted on counter reset |

## Deployment

1. Upload the `.wasm` file to the Vara network using:
   - [Gear IDEA](https://idea.gear-tech.io/)
   - [gear-js](https://github.com/gear-tech/gear-js)
   - Your generated TypeScript client

2. The program will be initialized when you send the first message.

## License

MIT
