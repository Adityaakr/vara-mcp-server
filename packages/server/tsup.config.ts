import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Bundle workspace dependencies into the output
  // Only externalize actual npm packages
  noExternal: [
    '@vara-mcp/runtime',
    '@vara-mcp/templates', 
    '@vara-mcp/chain',
  ],
});
