# Claude Agent SDK + Hyperbrowser: Agentic Browser Automation

**Built with [Hyperbrowser](https://hyperbrowser.ai)**

A powerful demo showing how the **[Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk/overview)** (reasoning) combines with **[Hyperbrowser](https://hyperbrowser.ai)** (AI browser automation platform) to create scalable agentic browser automation. Hyperbrowser's cloud-based architecture and natural language interface makes this significantly more context-efficient and scalable than traditional browser automation.

## Get an API Key

Get your Hyperbrowser API key at https://hyperbrowser.ai

## Architecture: Reasoning + Cloud Automation

This demo illustrates a clean separation of concerns:

- **Claude Agent SDK**: Handles all reasoning, planning, and decision-making
- **Hyperbrowser**: Executes browser actions via natural language commands in the cloud
- **Result**: Context-efficient automation where Claude decides *what* to do and Hyperbrowser handles *how* to do it

### Context Efficiency

**Hyperbrowser saves thousands of tokens per interaction** by handling DOM traversal and selector logic internally.

```typescript
// Traditional: ~500 tokens of context + implementation
- Full DOM structure passed to Claude
- Claude generates: await page.click('button[data-testid="auth-submit"][aria-label="Submit"]');
- Breaks if UI changes

// Hyperbrowser: ~50 tokens
- Claude calls: act({ action: "click the submit button" })
- Hyperbrowser figures out the selector
- Resilient to UI changes
```

## Installation

```bash
npm install
```

## Setup

Set your Hyperbrowser API key:
```bash
export HYPERBROWSER_API_KEY="your-api-key"
```

## Usage

### Interactive Mode
```bash
npx tsx agent-browse.ts
```

### With Initial Prompt
```bash
npx tsx agent-browse.ts "Go to Hacker News and get the title of the top post"
```

After Claude responds, you can:
- Ask follow-up questions
- Give new instructions
- Type `exit` or `quit` to end

### Example Tasks

```bash
# Complex multi-step workflow
npx tsx agent-browse.ts "Go to Hacker News, find the top post, click it, and summarize what it's about"

# Data extraction with reasoning
npx tsx agent-browse.ts "Navigate to example.com and extract any contact information you can find"

# Adaptive navigation
npx tsx agent-browse.ts "Go to github.com/hyperbrowser/hyperagent, take a screenshot, then find and click the documentation link"
```

Claude will:
1. **Plan** the steps needed (reasoning via Agent SDK)
2. **Execute** each step using Hyperbrowser tools (natural language browser actions)
3. **Adapt** based on what it sees (screenshots, extracted data)
4. **Report** back with results

## Hyperbrowser Tools

The demo exposes 6 Hyperbrowser automation tools via MCP:

| Tool | Description | Example |
|------|-------------|---------|
| `navigate` | Go to a URL | `navigate({ url: "https://example.com" })` |
| `act` | Perform actions via natural language | `act({ action: "click the login button" })` |
| `extract` | Get structured data from the page | `extract({ instruction: "extract the title", schema: { title: "string" } })` |
| `observe` | Discover what's on the page | `observe({ query: "find all buttons" })` |
| `screenshot` | Capture the current page | `screenshot({})` |
| `close_browser` | Clean up when done | `close_browser({})` |

### How It Works

```typescript
const q = query({
  prompt: generateMessages(),
  options: {
    mcpServers: {
      "hyperbrowser": hyperbrowserServer  // Register Hyperbrowser tools
    },
    allowedTools: [
      "mcp__hyperbrowser__navigate",
      "mcp__hyperbrowser__act",
      "mcp__hyperbrowser__extract",
      "mcp__hyperbrowser__observe",
      "mcp__hyperbrowser__screenshot",
      "mcp__hyperbrowser__close_browser"
    ]
  }
});
```

**The flow:**
1. Claude (via Agent SDK) decides what browser action to take
2. Claude calls a Hyperbrowser MCP tool with natural language parameters
3. Hyperbrowser translates the natural language into precise browser actions
4. Results flow back to Claude for the next decision

## Growth Engineering Use Cases

This architecture is perfect for growth engineering automation:
- **Auto-generate LinkedIn carousels** from scraped competitor stats
- **Monitor competitor pricing** and update your own automatically  
- **Extract user feedback** from review sites for product insights
- **Automate social media engagement** based on trending topics
- **Generate lead lists** by scraping industry directories

## Resources

- [Hyperbrowser Documentation](https://docs.hyperbrowser.ai)
- [Claude Agent SDK Documentation](https://docs.claude.com/en/api/agent-sdk/overview)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io)

Follow @hyperbrowser for updates.