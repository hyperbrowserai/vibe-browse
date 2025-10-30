import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
// Local headful HyperAgent (opens visible Chrome)
// Reference: https://www.hyperbrowser.ai/docs/agents/hyperagent
// @ts-ignore - package may not ship full TS types yet
import { HyperAgent } from '@hyperbrowser/agent';
import dotenv from 'dotenv';
dotenv.config();

// HyperAgent singleton (local, headful)
let agent: any | null = null;

async function ensureAgent() {
  if (!agent) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Missing ANTHROPIC_API_KEY for Claude');
    }
    // Use Claude via Anthropic in local headful HyperAgent
    const modelId = process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-latest';
    agent = new HyperAgent({
      llm: {
        provider: 'anthropic',
        model: modelId,
      },
    });
    if (agent.initialize) {
      await agent.initialize();
    }
  }
  return agent;
}

async function closeAgent() {
  if (agent && agent.closeAgent) {
    try { await agent.closeAgent(); } catch {}
  }
  agent = null;
}

// Export initialization function for pre-warming
export async function initializeAgent() {
  return await ensureAgent();
}

// Create the Hyperbrowser MCP server (keeping the name for compatibility)
const hyperbrowserServer = createSdkMcpServer({
  name: "hyperbrowser",
  version: "1.0.0",
  tools: [
    tool(
      "navigate",
      "Navigate to a URL using local headful HyperAgent (visible Chrome).",
      {
        url: z.string().describe("The URL to navigate to"),
      },
      async (args) => {
        try {
          const a = await ensureAgent();
          const result = await a.executeTask(
            `Go to ${args.url}. After it loads, write one plain sentence summarizing the page. Output ONLY the sentence. No JSON, no markdown, no preface.`
          );
          return {
            content: [
              {
                type: "text",
                text: `Navigated to ${args.url}\n\n${typeof result === 'string' ? result.trim() : ''}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error navigating: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    ),

    tool(
      "act",
      "Perform an action using local headful HyperAgent (e.g., 'click the login button', 'type \"hello\" and press enter')",
      {
        action: z.string().describe("Natural language description of the action to perform"),
      },
      async (args) => {
        try {
          const a = await ensureAgent();
          const result = await a.executeTask(
            `Perform the following action precisely: ${args.action}. When complete, reply with a short confirmation in plain text (max one sentence). Do not include JSON, markdown, or extra metadata.`
          );
          return {
            content: [
              {
                type: "text",
                text: typeof result === 'string' ? result.trim() : 'Action completed.',
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error performing action: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    ),

    tool(
      "extract",
      "Extract structured data using local headful HyperAgent",
      {
        instruction: z.string().describe("What data to extract (e.g., 'extract all article titles', 'get all links')"),
      },
      async (args) => {
        try {
          const a = await ensureAgent();
          const result = await a.executeTask(
            `Extract data as requested: ${args.instruction}. Return ONLY plain text values, one item per line, with no JSON, no markdown, and no extra commentary.`
          );

          return {
            content: [
              {
                type: "text",
                text: typeof result === 'string' ? result : '',
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error extracting data: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    ),

    tool(
      "observe",
      "Discover what's on the page using local headful HyperAgent",
      {
        query: z.string().describe("What to observe (e.g., 'find all buttons', 'list all links')"),
      },
      async (args) => {
        try {
          const a = await ensureAgent();
          const result = await a.executeTask(
            `Observe and answer: ${args.query}. Reply concisely in plain text only. Do not include JSON or markdown.`
          );

          return {
            content: [
              {
                type: "text",
                text: typeof result === 'string' ? result : '',
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error observing: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    ),

    tool(
      "screenshot",
      "Ask local headful HyperAgent to capture a screenshot and confirm",
      {},
      async () => {
        try {
          const a = await ensureAgent();
          const result = await a.executeTask('Take a screenshot of the current page and confirm');
          return {
            content: [
              {
                type: "text",
                text: typeof result === 'string' ? result : JSON.stringify(result),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error taking screenshot: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    ),

    tool(
      "batch",
      "Execute multiple browser actions in a single call for speed (e.g., 'navigate to X, then click Y, then extract Z')",
      {
        steps: z.string().describe("Natural language description of multiple actions to perform sequentially"),
      },
      async (args) => {
        try {
          const a = await ensureAgent();
          const result = await a.executeTask(args.steps);
          return {
            content: [
              {
                type: "text",
                text: typeof result === 'string' ? result.trim() : JSON.stringify(result),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error executing batch: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    ),

    tool(
      "close_browser",
      "Close the local HyperAgent and cleanup resources",
      {},
      async () => {
        try {
          await closeAgent();
          return {
            content: [
              {
                type: "text",
                text: "Local HyperAgent closed successfully",
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error closing browser: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
    ),
  ],
});

// Handle cleanup on process exit
process.on("SIGINT", async () => {
  await closeAgent();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeAgent();
  process.exit(0);
});

export default hyperbrowserServer;