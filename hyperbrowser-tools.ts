import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
// TODO: Replace with Hyperbrowser imports
// import { HyperAgent } from '@hyperbrowser/hyperagent';
import { existsSync, mkdirSync } from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { findLocalChrome, takeScreenshot } from './browser-utils.js';
import dotenv from 'dotenv';
dotenv.config();

// Lazy loading of Hyperbrowser instance
let hyperbrowserInstance: any | null = null;
let currentPage: any = null;
let chromeProcess: ChildProcess | null = null;
let tempUserDataDir: string | null = null;

async function getHyperbrowser() {
  if (!hyperbrowserInstance) {
    //console.log('[Hyperbrowser] Initializing...');
    const chromePath = findLocalChrome();
    //console.log(`[Hyperbrowser] Found Chrome at: ${chromePath}`);

    if (!chromePath) {
      throw new Error(
        `Could not find local Chrome installation. Please install Chrome or Chromium for your platform:\n` +
        `- macOS: Install Google Chrome from https://www.google.com/chrome/\n` +
        `- Windows: Install Google Chrome from https://www.google.com/chrome/\n` +
        `- Linux: Run 'sudo apt install google-chrome-stable' or 'sudo apt install chromium-browser'`
      );
    }

    const cdpPort = 9222;
    //console.log(`[Hyperbrowser] CDP Port: ${cdpPort}`);

    // Use a persistent directory in the current working directory for Chrome automation
    tempUserDataDir = join(process.cwd(), '.chrome-profile');

    // Launch Chrome with remote debugging enabled
    //console.log('[Hyperbrowser] Launching Chrome with remote debugging...');
    //console.log(`[Hyperbrowser] User data dir: ${tempUserDataDir}`);

    const chromeArgs = [
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${tempUserDataDir}`,
    ];

    //console.log(`[Hyperbrowser] Command: ${chromePath} ${chromeArgs.join(' ')}`);

    chromeProcess = spawn(chromePath, chromeArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    chromeProcess.stdout?.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg.includes('DevTools listening')) {
        //console.log(`[Chrome]: ${msg}`);
      }
    });

    chromeProcess.stderr?.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg.includes('DevTools listening')) {
        //console.log(`[Chrome]: ${msg}`);
      }
    });

    chromeProcess.on('error', (err) => {
      console.error(`[Hyperbrowser] Failed to launch Chrome: ${err}`);
    });

    // Wait for Chrome to start and the debugging port to be ready
    //console.log('[Hyperbrowser] Waiting for Chrome CDP to be ready...');
    let chromeReady = false;
    for (let i = 0; i < 50; i++) {
      try {
        // Try both 127.0.0.1 and localhost
        const response = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
        if (response.ok) {
          //console.log(`[Hyperbrowser] Chrome CDP is ready (attempt ${i + 1})`);
          chromeReady = true;
          break;
        }
      } catch (error) {
        if (i % 10 === 0 && i > 0) {
          //console.log(`[Hyperbrowser] Still waiting for CDP... (attempt ${i + 1}/50)`);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (!chromeReady) {
      throw new Error(`Chrome failed to start with remote debugging on port ${cdpPort}`);
    }

    // Connect to Chrome via CDP
    //console.log('[Hyperbrowser] Connecting to Chrome via CDP...');
    // TODO: Replace with Hyperbrowser initialization
    hyperbrowserInstance = null; // new HyperAgent({
      env: "LOCAL",
      verbose: 0,
      enableCaching: true,
      modelName: "anthropic/claude-haiku-4-5-20251001",
      localBrowserLaunchOptions: {
        cdpUrl: `http://localhost:${cdpPort}`,
      },
    });
    // await hyperbrowserInstance.init();
    //console.log('[Hyperbrowser] Connected successfully');
    // currentPage = hyperbrowserInstance.page;

    // Wait for browser context to be fully ready by checking if we can access the page
    let retries = 0;
    const maxRetries = 30;
    while (retries < maxRetries) {
      try {
        // Try to check if page is accessible and ready
        await currentPage.evaluate(() => document.readyState);
        // If we get here, the page is ready
        break;
      } catch (error) {
        // Page not ready yet, wait and retry
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
    }

    if (retries >= maxRetries) {
      throw new Error("Browser failed to become ready within timeout");
    }

    // Configure download behavior via CDP
    const downloadsPath = join(process.cwd(), 'agent', 'downloads');
    if (!existsSync(downloadsPath)) {
      mkdirSync(downloadsPath, { recursive: true });
    }

    const context = currentPage.context();
    const client = await context.newCDPSession(currentPage);
    await client.send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadsPath,
      eventsEnabled: true,
    });
  }
  return { hyperbrowser: hyperbrowserInstance, page: currentPage };
}

async function closeHyperbrowser() {
  if (hyperbrowserInstance) {
    // await hyperbrowserInstance.close();
    hyperbrowserInstance = null;
    currentPage = null;
  }
  if (chromeProcess) {
    chromeProcess.kill();
    chromeProcess = null;
  }
  // Note: We keep the temp user data directory for reuse in future sessions
  tempUserDataDir = null;
}

// Create the custom MCP server
const hyperbrowserServer = createSdkMcpServer({
  name: "hyperbrowser",
  version: "1.0.0",
  tools: [
    tool(
      "navigate",
      "Navigate to a URL in the browser. Will save a screenshot of the page after the navigation is completed.",
      {
        url: z.string().describe("The URL to navigate to"),
      },
      async (args) => {
        try {
          const { page } = await getHyperbrowser();
          await page.goto(args.url);
          const screenshotPath = await takeScreenshot(page);
          return {
            content: [
              {
                type: "text",
                text: `Successfully navigated to ${args.url}\nScreenshot saved to ${screenshotPath}`,
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
      "Perform an action on the page using natural language (e.g., 'click the login button', 'fill in the email field with test@example.com'). Will save a screenshot of the page after the action is performed.",
      {
        action: z.string().describe("Natural language description of the action to perform"),
      },
      async (args) => {
        try {
          const { page } = await getHyperbrowser();
          await page.act(args.action);
          const screenshotPath = await takeScreenshot(page);
          return {
            content: [
              {
                type: "text",
                text: `Successfully performed action: ${args.action}\nScreenshot saved to ${screenshotPath}`,
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
      "Extract structured data from the current page using a schema",
      {
        instruction: z.string().describe("Natural language description of what to extract"),
        schema: z.record(z.string(), z.enum(["string", "number", "boolean"])).describe("Schema definition as an object where keys are field names and values are types ('string', 'number', or 'boolean')"),
      },
      async (args) => {
        try {
          const { page } = await getHyperbrowser();

          // Convert simple schema to Zod schema
          const zodSchema: Record<string, any> = {};
          for (const [key, type] of Object.entries(args.schema)) {
            switch (type) {
              case "string":
                zodSchema[key] = z.string();
                break;
              case "number":
                zodSchema[key] = z.number();
                break;
              case "boolean":
                zodSchema[key] = z.boolean();
                break;
            }
          }

          const result = await page.extract({
            instruction: args.instruction,
            schema: z.object(zodSchema),
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
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
      "Discover available actions on the page (e.g., 'find all buttons', 'find submit buttons')",
      {
        query: z.string().describe("Natural language query to discover elements"),
      },
      async (args) => {
        try {
          const { page } = await getHyperbrowser();
          const actions = await page.observe(args.query);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(actions, null, 2),
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
      "Take a screenshot of the current page.",
      {
      },
      async (args) => {
        try {
          const { page } = await getHyperbrowser();
          const screenshotPath = await takeScreenshot(page);
          return {
            content: [
              {
                type: "text",
                text: `Screenshot saved to ${screenshotPath}`,
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
      "close_browser",
      "Close the browser and cleanup resources",
      {},
      async () => {
        try {
          await closeHyperbrowser();
          return {
            content: [
              {
                type: "text",
                text: "Browser closed successfully",
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
  await closeHyperbrowser();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeHyperbrowser();
  process.exit(0);
});

export default hyperbrowserServer;
