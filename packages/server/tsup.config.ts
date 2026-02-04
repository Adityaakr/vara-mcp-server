import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: { entry: ['src/index.ts'] },
  clean: true,
  sourcemap: true,
  target: 'node18',
  splitting: false, // Don't split into chunks - each file is standalone
  banner: {
    js: '#!/usr/bin/env node',
  },
  noExternal: [
    '@vara-mcp/runtime',
    '@vara-mcp/templates', 
    '@vara-mcp/chain',
  ],
});
