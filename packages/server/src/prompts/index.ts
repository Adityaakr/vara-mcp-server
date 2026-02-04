/**
 * MCP Prompts for Vara development workflows
 */

export interface PromptDefinition {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

export interface PromptMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text';
    text: string;
  };
}

/**
 * Available prompts
 */
export const PROMPTS: PromptDefinition[] = [
  {
    name: 'create-vara-mvp',
    description:
      'Create a complete Vara MVP (Counter) - scaffolds a program, compiles it, runs tests, and generates a TypeScript client',
    arguments: [
      {
        name: 'project_name',
        description: 'Name for the new project (must be valid Rust crate name)',
        required: true,
      },
      {
        name: 'output_directory',
        description: 'Directory to create the project in (defaults to workspace root)',
        required: false,
      },
    ],
  },
  {
    name: 'add-feature-to-program',
    description:
      'Get guidance on adding a new feature to an existing Vara program, with code suggestions and updated client bindings',
    arguments: [
      {
        name: 'project_path',
        description: 'Path to the existing project',
        required: true,
      },
      {
        name: 'feature_description',
        description: 'Description of the feature to add',
        required: true,
      },
    ],
  },
];

/**
 * Get prompt messages for "Create a Vara MVP"
 */
export function getCreateMvpPrompt(projectName: string, outputDirectory?: string): PromptMessage[] {
  const outputDir = outputDirectory || '.';
  
  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `I want to create a new Vara smart program called "${projectName}" in ${outputDir === '.' ? 'the current directory' : outputDir}.

Please help me set up a complete MVP by:

1. **Scaffold the program** using the "counter" template
2. **Compile it** to WASM (release mode)
3. **Run the tests** to verify everything works
4. **Generate a TypeScript client** so I can interact with it

After each step, let me know the results and any issues. At the end, give me a summary with:
- Location of the WASM file
- Location of the IDL file  
- How to run the client
- Next steps for deployment

Let's start!`,
      },
    },
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: `I'll help you create a complete Vara MVP called "${projectName}". Let me execute these steps in sequence:

**Step 1: Scaffolding the program...**

I'll use the \`vara_scaffold_program\` tool to create the project from the counter template.`,
      },
    },
  ];
}

/**
 * Get prompt messages for "Add Feature to Program"
 */
export function getAddFeaturePrompt(
  projectPath: string,
  featureDescription: string
): PromptMessage[] {
  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `I have an existing Vara program at "${projectPath}" and I want to add a new feature:

**Feature Request:**
${featureDescription}

Please:
1. Analyze the existing program code (especially src/lib.rs)
2. Suggest the code changes needed to implement this feature
3. Explain any new events or state that should be added
4. After implementation, regenerate the TypeScript client to include the new functionality

I'd like specific code suggestions that follow Sails best practices.`,
      },
    },
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: `I'll help you add this feature to your Vara program. Let me start by analyzing the existing code.

First, I need to understand the current program structure. Let me examine the project at "${projectPath}".

**Note:** In this version, I'll provide advisory guidance and code suggestions. You may need to manually apply some changes and then use the \`vara_compile\` and \`vara_client_scaffold\` tools to rebuild.

Let me search the docs for relevant patterns for your feature...`,
      },
    },
  ];
}

/**
 * Get all prompt definitions
 */
export function getPromptDefinitions(): PromptDefinition[] {
  return PROMPTS;
}

/**
 * Get messages for a specific prompt
 */
export function getPromptMessages(
  name: string,
  args: Record<string, string>
): PromptMessage[] | null {
  switch (name) {
    case 'create-vara-mvp':
      return getCreateMvpPrompt(args.project_name, args.output_directory);
    case 'add-feature-to-program':
      return getAddFeaturePrompt(args.project_path, args.feature_description);
    default:
      return null;
  }
}
