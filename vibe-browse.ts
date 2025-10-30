import { query } from '@anthropic-ai/claude-agent-sdk';
import type { HookJSONOutput } from "@anthropic-ai/claude-agent-sdk";
import * as path from "path";
import * as readline from "readline";
import hyperbrowserServer, { initializeAgent } from './hyperbrowser-tools.js';
import { ensureDirectories } from './browser-utils.js';

// ANSI color codes for prettier output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

async function main() {
  // Ensure required directories exist for Hyperbrowser operations
  ensureDirectories();

  // Pre-initialize HyperAgent to avoid first-action penalty
  process.stdout.write(`${colors.dim}Initializing browser...${colors.reset}`);
  await initializeAgent();
  process.stdout.write(`\r\x1b[K${colors.green}✓ Browser ready${colors.reset}\n`);

  // Get initial prompt from command line arguments
  const args = process.argv.slice(2);
  const hasInitialPrompt = args.length > 0;
  const initialPrompt = hasInitialPrompt ? args.join(' ') : null;

  if (hasInitialPrompt) {
    console.log(`${colors.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}You:${colors.reset} ${initialPrompt}`);
    console.log(`${colors.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  }

  // Create readline interface for interactive input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const getUserInput = (prompt: string = `\n${colors.bright}${colors.cyan}You:${colors.reset} `): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  };

  let shouldPromptUser = !hasInitialPrompt; // If no initial prompt, ask for input immediately
  let conversationActive = true;
  let loadingInterval: NodeJS.Timeout | null = null;
  let loadingActive = false;

  const startLoading = (message: string = 'Working...') => {
    if (loadingActive) return;
    loadingActive = true;
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    process.stdout.write('\n');
    loadingInterval = setInterval(() => {
      process.stdout.write(`\r${colors.dim}${frames[i]} ${message}${colors.reset}`);
      i = (i + 1) % frames.length;
    }, 80);
  };

  const stopLoading = () => {
    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
      process.stdout.write('\r\x1b[K'); // Clear the line
      loadingActive = false;
    }
  };

  // Streaming input mode: creates an async generator for multi-turn conversations
  async function* generateMessages() {
    // Send initial prompt if provided
    if (initialPrompt) {
      yield {
        type: "user" as const,
        message: {
          role: "user" as const,
          content: initialPrompt
        },
        parent_tool_use_id: null,
        session_id: "default"
      };
    }

    // Keep accepting new messages
    while (conversationActive) {
      // Wait until we're ready for next input
      while (!shouldPromptUser && conversationActive) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!conversationActive) break;

      shouldPromptUser = false;
      const userInput = await getUserInput();

      if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
        conversationActive = false;
        console.log(`\n${colors.dim}Goodbye!${colors.reset}`);
        break;
      }

      yield {
        type: "user" as const,
        message: {
          role: "user" as const,
          content: userInput
        },
        parent_tool_use_id: null,
        session_id: "default"
      };
    }
  }

  const q = query({
    prompt: generateMessages(),
    options: {
      systemPrompt: { type: 'preset', preset: 'claude_code', append: "\n\nGuidelines: Keep replies concise and conversational. Avoid dumping large JSON. Only take screenshots when explicitly requested or on errors. For multi-step browser tasks, prefer using the 'batch' tool to execute all steps in a single call for better performance." },
      maxTurns: 100,
      cwd: path.join(process.cwd(), 'agent'),
      model: "sonnet",
      executable: "node", // Use the current node binary path
      mcpServers: {
        "hyperbrowser": hyperbrowserServer
      },
      allowedTools: [
        "Task", "Bash", "Glob", "Grep", "LS", "ExitPlanMode", "Read", "Edit", "MultiEdit", "Write", "NotebookEdit",
        "WebFetch", "TodoWrite", "WebSearch", "BashOutput", "KillBash",
        "mcp__hyperbrowser__navigate", "mcp__hyperbrowser__act", "mcp__hyperbrowser__extract",
        "mcp__hyperbrowser__observe", "mcp__hyperbrowser__screenshot", "mcp__hyperbrowser__batch",
        "mcp__hyperbrowser__close_browser"
      ],
      hooks: {
        PreToolUse: [
          {
            matcher: "Write|Edit|MultiEdit",
            hooks: [
              async (input: any): Promise<HookJSONOutput> => {
                const toolName = input.tool_name;
                const toolInput = input.tool_input;

                if (!['Write', 'Edit', 'MultiEdit'].includes(toolName)) {
                  return { continue: true };
                }

                let filePath = '';
                if (toolName === 'Write' || toolName === 'Edit') {
                  filePath = toolInput.file_path || '';
                } else if (toolName === 'MultiEdit') {
                  filePath = toolInput.file_path || '';
                }

                const ext = path.extname(filePath).toLowerCase();
                if (ext === '.js' || ext === '.ts') {
                  const customScriptsPath = path.join(process.cwd(), 'agent', 'custom_scripts');

                  if (!filePath.startsWith(customScriptsPath)) {
                    return {
                      decision: 'block',
                      stopReason: `Script files (.js and .ts) must be written to the custom_scripts directory. Please use the path: ${customScriptsPath}/${path.basename(filePath)}`,
                      continue: false
                    };
                  }
                }

                return { continue: true };
              }
            ]
          }
        ]
      },
    },
  });

  for await (const message of q) {
    // Handle assistant messages (Claude's responses and tool uses)
    if (message.type === 'assistant' && message.message) {
      stopLoading();
      
      const textContent = message.message.content.find((c: any) => c.type === 'text');
      if (textContent && 'text' in textContent) {
        console.log(`\n${colors.bright}${colors.magenta}Claude:${colors.reset} ${textContent.text}`);
      }

      // Show tool uses with relevant parameters (but not full JSON)
      const toolUses = message.message.content.filter((c: any) => c.type === 'tool_use');
      let loadingMessage = 'Executing...';
      
      for (const toolUse of toolUses) {
        const toolName = (toolUse as any).name.replace('mcp__hyperbrowser__', '');
        const input = (toolUse as any).input || {};
        
        // Show tool with context
        console.log(`\n${colors.blue}🔧 ${colors.reset}${colors.bright}${toolName}${colors.reset}`);
        
        // Show relevant parameters and set loading message
        if (input.url) {
          console.log(`   ${colors.dim}→ ${input.url}${colors.reset}`);
          loadingMessage = 'Loading page...';
        } else if (input.action) {
          console.log(`   ${colors.dim}→ ${input.action}${colors.reset}`);
          loadingMessage = 'Performing action...';
        } else if (input.instruction) {
          console.log(`   ${colors.dim}→ ${input.instruction}${colors.reset}`);
          loadingMessage = 'Extracting data...';
        } else if (input.query) {
          console.log(`   ${colors.dim}→ ${input.query}${colors.reset}`);
          loadingMessage = 'Observing page...';
        } else if (input.steps) {
          console.log(`   ${colors.dim}→ ${input.steps}${colors.reset}`);
          loadingMessage = 'Executing batch actions...';
        } else if (toolName === 'screenshot') {
          loadingMessage = 'Capturing screenshot...';
        }
      }
      
      if (toolUses.length > 0) {
        startLoading(loadingMessage);
      }
    }

    // Handle tool results (these come as 'user' type messages)
    if (message.type === 'user' && message.message) {
      stopLoading();
      
      const content = message.message.content;
      // Content can be a string or an array
      if (Array.isArray(content)) {
        const toolResults = content.filter((c: any) => c.type === 'tool_result');
        for (const result of toolResults as any[]) {
          // Handle errors
          if (result.is_error) {
            const errorText = typeof result.content === 'string'
              ? result.content
              : JSON.stringify(result.content);
            console.log(`\n${colors.red}❌ Tool error:${colors.reset} ${errorText}`);
            continue;
          }

          // Handle successful results
          if (result.content) {
            // Content can be a string or an array
            if (typeof result.content === 'string') {
              const concise = result.content.length > 600 ? result.content.slice(0, 600) + '…' : result.content;
              console.log(`\n${colors.green}✓${colors.reset} ${colors.dim}${concise}${colors.reset}`);
            } else if (Array.isArray(result.content)) {
              const textResult = result.content.find((c: any) => c.type === 'text');
              if (textResult) {
                const t = String(textResult.text);
                const concise = t.length > 600 ? t.slice(0, 600) + '…' : t;
                console.log(`\n${colors.green}✓${colors.reset} ${colors.dim}${concise}${colors.reset}`);
              }
            }
          }
        }
      }
      
      startLoading('Thinking...');
    }

    // Handle result message - this signals the conversation is complete and we should prompt for input
    if (message.type === 'result') {
      stopLoading();
      // Hand control back to user for follow-up questions
      shouldPromptUser = true;
    }
  }

  // Only close readline when conversation is fully done
  rl.close();
  process.exit(0);
}

main().catch(console.error);
