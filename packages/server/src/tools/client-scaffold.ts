import { existsSync, writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { resolveWithinRoot, logger } from '@vara-mcp/runtime';
import { generateClientFiles } from '@vara-mcp/chain';
import type { ClientScaffoldInput } from './schemas.js';

export interface ClientScaffoldResult {
  success: boolean;
  outDir: string;
  createdFiles: string[];
  wasmPath?: string;
  idlPath?: string;
  nextSteps: string[];
  error?: string;
}

/**
 * Scaffold a TypeScript client for a Vara program
 */
export async function scaffoldClient(
  input: ClientScaffoldInput,
  workspaceRoot: string
): Promise<ClientScaffoldResult> {
  const { workspacePath, projectPath, outDir } = input;

  // Resolve paths
  const effectiveWorkspace = workspacePath
    ? resolveWithinRoot(workspaceRoot, workspacePath)
    : workspaceRoot;

  const effectiveProjectPath = projectPath
    ? resolveWithinRoot(effectiveWorkspace, projectPath)
    : effectiveWorkspace;

  const clientDir = resolveWithinRoot(effectiveWorkspace, outDir);

  // Get project name from Cargo.toml if available
  let projectName = 'vara-program';
  const cargoToml = join(effectiveProjectPath, 'Cargo.toml');
  if (existsSync(cargoToml)) {
    const cargoContent = readFileSync(cargoToml, 'utf-8');
    const nameMatch = cargoContent.match(/name\s*=\s*"([^"]+)"/);
    if (nameMatch) {
      projectName = nameMatch[1];
    }
  }

  // Find WASM and IDL files
  const { wasmPath, idlPath } = findBuildArtifacts(effectiveProjectPath);

  // Read IDL content if available
  let idlContent: string | undefined;
  if (idlPath && existsSync(idlPath)) {
    idlContent = readFileSync(idlPath, 'utf-8');
  }

  // Generate client files
  const files = generateClientFiles({
    projectName,
    idlContent,
    wasmPath: wasmPath ? join('..', wasmPath.replace(effectiveProjectPath, '').replace(/^\//, '')) : undefined,
  });

  // Create output directory
  if (!existsSync(clientDir)) {
    mkdirSync(clientDir, { recursive: true });
  }

  const createdFiles: string[] = [];

  // Write all generated files
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = join(clientDir, relativePath);
    const fileDir = dirname(filePath);

    if (!existsSync(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }

    writeFileSync(filePath, content, 'utf-8');
    createdFiles.push(relativePath);
    logger.info(`Created: ${filePath}`);
  }

  const nextSteps = [
    `cd ${outDir}`,
    'npm install',
    'npm run build',
    'Set VARA_SEED environment variable with your seed phrase',
    wasmPath ? `WASM file: ${wasmPath}` : 'Build the program first: cargo build --release',
    idlPath ? `IDL file: ${idlPath}` : 'IDL will be generated during build',
  ];

  return {
    success: true,
    outDir: clientDir,
    createdFiles,
    wasmPath: wasmPath ?? undefined,
    idlPath: idlPath ?? undefined,
    nextSteps,
  };
}

/**
 * Find build artifacts (WASM and IDL files)
 */
function findBuildArtifacts(projectPath: string): { wasmPath: string | null; idlPath: string | null } {
  let wasmPath: string | null = null;
  let idlPath: string | null = null;

  // Look in release first, then debug
  const profiles = ['release', 'debug'];
  
  // Template outputs to target/wasm32-gear/release/ only
  const targets = ['wasm32-gear', 'wasm32v1-none'];

  for (const target of targets) {
    for (const profile of profiles) {
      const targetDir = join(projectPath, 'target', target, profile);
      
      if (!existsSync(targetDir)) {
        continue;
      }

      try {
        const files = readdirSync(targetDir);
        
        for (const file of files) {
          // Prefer .opt.wasm over regular .wasm
          if (file.endsWith('.opt.wasm') && !wasmPath) {
            wasmPath = join(targetDir, file);
          } else if (file.endsWith('.wasm') && !file.endsWith('.opt.wasm') && !wasmPath) {
            wasmPath = join(targetDir, file);
          }
          
          if (file.endsWith('.idl') && !idlPath) {
            idlPath = join(targetDir, file);
          }
        }

        // If we found both, we're done
        if (wasmPath && idlPath) {
          return { wasmPath, idlPath };
        }
      } catch {
        // Directory might not be accessible
      }
    }
  }

  return { wasmPath, idlPath };
}
