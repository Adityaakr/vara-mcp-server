import type { DocsSearchInput } from './schemas.js';

/**
 * Documentation entry
 */
interface DocEntry {
  id: string;
  title: string;
  content: string;
  section: string;
  keywords: string[];
}

/**
 * Search result
 */
export interface DocsSearchResult {
  results: Array<{
    title: string;
    section: string;
    snippet: string;
    relevance: number;
  }>;
  totalFound: number;
}

/**
 * Bundled documentation for local search
 */
const BUNDLED_DOCS: DocEntry[] = [
  {
    id: 'quickstart-1',
    title: 'Getting Started with Sails',
    section: 'Vara Sails Quickstart',
    content: `
Sails is a framework for building smart programs on the Vara Network.
It provides a high-level abstraction over the low-level Gear Protocol.

## Prerequisites
- Rust toolchain with wasm32-unknown-unknown target
- cargo-sails CLI (optional but recommended)

## Quick Start
1. Create a new project: cargo sails new-program my-program
2. Build: cargo build --release
3. Test: cargo test

## Project Structure
- src/lib.rs: Main program code with #[service] and #[program] attributes
- Cargo.toml: Dependencies including sails-rs
- build.rs: Build script for WASM compilation
    `,
    keywords: ['quickstart', 'getting started', 'new project', 'setup', 'sails'],
  },
  {
    id: 'quickstart-2',
    title: 'Sails Service Definition',
    section: 'Vara Sails Quickstart',
    content: `
## Defining a Service

Services in Sails are defined using the #[sails_rs::service] attribute:

\`\`\`rust
#[derive(Default)]
pub struct MyService;

#[sails_rs::service]
impl MyService {
    pub fn new() -> Self {
        Self
    }
    
    // Command (mutates state)
    pub fn do_something(&mut self, param: u32) -> u32 {
        // Implementation
    }
    
    // Query (reads state)
    pub fn get_value(&self) -> u32 {
        // Implementation
    }
}
\`\`\`

Services can emit events using the events parameter in the service attribute.
    `,
    keywords: ['service', 'define', 'command', 'query', 'impl', 'attribute'],
  },
  {
    id: 'quickstart-3',
    title: 'Sails Program Definition',
    section: 'Vara Sails Quickstart',
    content: `
## Defining a Program

The program is the main entry point, defined with #[sails_rs::program]:

\`\`\`rust
pub struct MyProgram;

#[sails_rs::program]
impl MyProgram {
    // Constructor
    pub fn new() -> Self {
        // Initialize state
        Self
    }
    
    // Expose services
    pub fn my_service(&self) -> MyService {
        MyService::new()
    }
}
\`\`\`

The constructor is called when the program is initialized on-chain.
    `,
    keywords: ['program', 'constructor', 'new', 'entry point', 'initialize'],
  },
  {
    id: 'build-1',
    title: 'Building for WASM',
    section: 'Common Build Targets & Gotchas',
    content: `
## Build Targets

The default target for Vara programs is wasm32-unknown-unknown.

### Installing the Target
\`\`\`bash
rustup target add wasm32-unknown-unknown
\`\`\`

### Build Commands
Debug build:
\`\`\`bash
cargo build
\`\`\`

Release build (optimized):
\`\`\`bash
cargo build --release
\`\`\`

### Output Files
- target/wasm32-unknown-unknown/release/*.wasm - The compiled WASM
- target/wasm32-unknown-unknown/release/*.opt.wasm - Optimized WASM
- target/wasm32-unknown-unknown/release/*.idl - Interface definition
    `,
    keywords: ['build', 'wasm', 'target', 'release', 'debug', 'compile'],
  },
  {
    id: 'build-2',
    title: 'Common Build Issues',
    section: 'Common Build Targets & Gotchas',
    content: `
## Common Build Issues

### Target Not Installed
Error: "error[E0463]: can't find crate for 'std'"
Solution: rustup target add wasm32-unknown-unknown

### Missing sails-rs
Error: "can't find crate 'sails_rs'"
Solution: Ensure sails-rs is in Cargo.toml dependencies

### Build Script Errors
Error: "build script failed"
Solution: Ensure build.rs calls sails_rs::build_wasm()

### Memory Limits
Error: "wasm-ld: error: initial memory too small"
Solution: Add to Cargo.toml:
[profile.release]
opt-level = "s"
lto = true
    `,
    keywords: ['error', 'issue', 'problem', 'fix', 'troubleshoot', 'build failed'],
  },
  {
    id: 'gearjs-1',
    title: 'Connecting to Vara Network',
    section: 'Gear-JS Interaction Basics',
    content: `
## Connecting with Gear-JS

Install the Gear-JS API:
\`\`\`bash
npm install @gear-js/api @polkadot/api
\`\`\`

Connect to a node:
\`\`\`typescript
import { GearApi } from '@gear-js/api';

const api = await GearApi.create({
  providerAddress: 'wss://testnet.vara.network'
});

console.log('Connected to', api.genesisHash.toHex());
\`\`\`

### Network Endpoints
- Testnet: wss://testnet.vara.network
- Mainnet: wss://rpc.vara.network
    `,
    keywords: ['connect', 'gear-js', 'api', 'network', 'node', 'websocket'],
  },
  {
    id: 'gearjs-2',
    title: 'Uploading Programs',
    section: 'Gear-JS Interaction Basics',
    content: `
## Uploading Programs with Gear-JS

\`\`\`typescript
import { GearApi, GearKeyring } from '@gear-js/api';
import { readFileSync } from 'fs';

// Read WASM file
const code = readFileSync('./target/wasm32-unknown-unknown/release/my_program.opt.wasm');

// Create keyring
const keyring = await GearKeyring.fromSuri('//Alice');

// Calculate gas
const gas = await api.program.calculateGas.initUpload(
  keyring.address,
  code,
  initPayload,
  0
);

// Upload program
const program = api.program.upload({
  code,
  gasLimit: gas.min_limit,
  initPayload,
});

await program.signAndSend(keyring, ({ status, events }) => {
  if (status.isFinalized) {
    console.log('Program uploaded!');
  }
});
\`\`\`
    `,
    keywords: ['upload', 'deploy', 'program', 'wasm', 'gas', 'keyring'],
  },
  {
    id: 'gearjs-3',
    title: 'Sending Messages',
    section: 'Gear-JS Interaction Basics',
    content: `
## Sending Messages to Programs

\`\`\`typescript
// Calculate gas for message
const gas = await api.program.calculateGas.handle(
  keyring.address,
  programId,
  payload,
  0
);

// Send message
const message = api.message.send({
  destination: programId,
  payload,
  gasLimit: gas.min_limit,
  value: 0,
});

await message.signAndSend(keyring, ({ status }) => {
  if (status.isFinalized) {
    console.log('Message sent!');
  }
});
\`\`\`

### Payload Encoding
Payloads are encoded according to the program's IDL.
Use the metadata from the IDL file for proper encoding.
    `,
    keywords: ['message', 'send', 'payload', 'gas', 'handle', 'call'],
  },
  {
    id: 'gearjs-4',
    title: 'Reading Program State',
    section: 'Gear-JS Interaction Basics',
    content: `
## Reading Program State

\`\`\`typescript
// Read full state
const state = await api.programState.read({
  programId,
  payload: null // or specific query
}, metadata);

console.log('State:', state.toJSON());

// Read specific state query
const result = await api.programState.read({
  programId,
  payload: { GetValue: null }
}, metadata);
\`\`\`

### State Queries vs Messages
- State queries are free (no gas)
- State queries don't modify state
- Use for read-only operations
    `,
    keywords: ['state', 'read', 'query', 'free', 'no gas'],
  },
  {
    id: 'events-1',
    title: 'Working with Events',
    section: 'Gear-JS Interaction Basics',
    content: `
## Defining Events in Sails

\`\`\`rust
#[derive(Debug, Encode, Decode, TypeInfo)]
pub enum MyEvent {
    ValueChanged { old: u32, new: u32 },
    OperationComplete { id: String },
}

#[sails_rs::service(events = MyEvent)]
impl MyService {
    pub fn do_action(&mut self) -> u32 {
        // Emit event
        self.notify_on(MyEvent::ValueChanged { 
            old: 0, 
            new: 1 
        }).expect("Failed to emit");
        1
    }
}
\`\`\`

## Listening for Events

\`\`\`typescript
api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data }) => {
  const { message } = data;
  if (message.destination.eq(yourProgramId)) {
    console.log('Event:', message.payload.toHuman());
  }
});
\`\`\`
    `,
    keywords: ['events', 'emit', 'subscribe', 'listen', 'notify'],
  },
];

/**
 * Search bundled documentation
 */
export function searchDocs(input: DocsSearchInput): DocsSearchResult {
  const { query, maxResults } = input;
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

  // Score each document
  const scored = BUNDLED_DOCS.map((doc) => {
    let score = 0;
    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();

    // Title match (highest weight)
    if (titleLower.includes(queryLower)) {
      score += 10;
    }
    for (const word of queryWords) {
      if (titleLower.includes(word)) {
        score += 5;
      }
    }

    // Keyword match
    for (const keyword of doc.keywords) {
      if (keyword.includes(queryLower) || queryLower.includes(keyword)) {
        score += 3;
      }
      for (const word of queryWords) {
        if (keyword.includes(word)) {
          score += 2;
        }
      }
    }

    // Content match
    for (const word of queryWords) {
      const matches = contentLower.split(word).length - 1;
      score += Math.min(matches, 5); // Cap at 5 matches per word
    }

    return { doc, score };
  });

  // Sort by score and take top results
  const sorted = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  // Format results
  const results = sorted.map(({ doc, score }) => ({
    title: doc.title,
    section: doc.section,
    snippet: extractSnippet(doc.content, queryWords),
    relevance: Math.min(score / 10, 1), // Normalize to 0-1
  }));

  return {
    results,
    totalFound: sorted.length,
  };
}

/**
 * Extract a relevant snippet from content
 */
function extractSnippet(content: string, queryWords: string[]): string {
  const lines = content.split('\n').filter((l) => l.trim());
  const contentLower = content.toLowerCase();

  // Find the most relevant line
  let bestLine = 0;
  let bestScore = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      if (lineLower.includes(word)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestLine = i;
    }
  }

  // Get context around the best line
  const start = Math.max(0, bestLine - 1);
  const end = Math.min(lines.length, bestLine + 3);
  let snippet = lines.slice(start, end).join('\n');

  // Truncate if too long
  if (snippet.length > 300) {
    snippet = snippet.slice(0, 300) + '...';
  }

  return snippet.trim();
}
