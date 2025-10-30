# Vibe Browse

**Built with [Hyperbrowser](https://hyperbrowser.ai)**

Control a visible Chrome browser through natural language. Built on HyperAgent and Claude Agents for conversational web automation.

## What It Does

- Conversational browser automation through natural language chat
- Navigate, click, type, extract data, and observe pages with simple commands
- Interactive CLI that maintains context across multiple requests
- Runs a visible Chrome instance you can watch

## Get an API Key

Get your Anthropic API key at https://console.anthropic.com

## Setup

```bash
npm install
```

Create a `.env` file:
```bash
ANTHROPIC_API_KEY=your-key-here
ANTHROPIC_MODEL=claude-3-7-sonnet-latest
```

## Usage

Start an interactive session:
```bash
npm start
```

Or with an initial prompt:
```bash
npm start "Go to Hacker News and get the top post title"
```

### Example Commands

```
Go to github.com/hyperbrowser/hyperagent and summarize the README
Navigate to example.com and extract all contact info
Search for TypeScript on Google and click the first result
```

After each response, continue the conversation or type `exit` to quit.

## Growth Use Case

Perfect for automating growth tasks like scraping competitor data, monitoring pricing, extracting user feedback from review sites, or generating lead lists from directories.

## Resources

- [Hyperbrowser Docs](https://docs.hyperbrowser.ai)
- [HyperAgent SDK](https://www.hyperbrowser.ai/docs/agents/hyperagent)

Follow @hyperbrowser for updates.
