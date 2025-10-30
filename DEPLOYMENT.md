# 🚀 Vibe Browsing - Deployment Guide

**Built with [Hyperbrowser](https://hyperbrowser.ai)**

## Quick Start (2 minutes)

### 1. Get API Key
Get your Hyperbrowser API key at https://hyperbrowser.ai

### 2. Set Environment Variable
```bash
export HYPERBROWSER_API_KEY="your-api-key-here"
export ANTHROPIC_API_KEY="your-anthropic-key"
```

### 3. Test Interactive Mode
```bash
# Start conversational mode
npx tsx vibe-browse.ts

# Or with an initial prompt
npx tsx vibe-browse.ts "Go to Hacker News and get the top post title"
```

## Production Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

ENV HYPERBROWSER_API_KEY=""
ENV ANTHROPIC_API_KEY=""

CMD ["npx", "tsx", "vibe-browse.ts"]
```

### Environment Variables
```bash
# Required
HYPERBROWSER_API_KEY=your-hyperbrowser-key
ANTHROPIC_API_KEY=your-anthropic-key

# Optional
NODE_ENV=production
```

### Scaling Considerations

**Multi-User Support**: ✅ Ready
- Each user gets their own Hyperbrowser session
- No shared state between sessions
- Automatic cleanup on session end

**Cost Optimization**:
- Sessions auto-close after inactivity
- Pay-per-use pricing model
- No infrastructure overhead

**Monitoring**:
- All Hyperbrowser operations are logged
- Session IDs for tracking
- Built-in error handling

## Growth Engineering Use Cases

### 1. Competitor Monitoring
```bash
npx tsx vibe-browse.ts "Go to competitor.com, extract pricing information, and save to CSV"
```

### 2. Lead Generation
```bash
npx tsx vibe-browse.ts "Search LinkedIn for 'startup founders in AI', extract contact info from first 10 results"
```

### 3. Content Creation
```bash
npx tsx vibe-browse.ts "Go to trending topics on Twitter, extract top 5 hashtags, and create a summary report"
```

### 4. Market Research
```bash
npx tsx vibe-browse.ts "Visit top 10 SaaS tools websites, extract their pricing models and features"
```

## API Limits & Best Practices

- **Concurrent Sessions**: Unlimited (pay-per-use)
- **Session Duration**: Auto-cleanup after 30min inactivity
- **Rate Limits**: Managed by Hyperbrowser infrastructure
- **Best Practice**: Always call `close_browser` when done

## Support

- 📚 Documentation: https://docs.hyperbrowser.ai
- 🐛 Issues: Create GitHub issues in this repo
- 💬 Community: Follow @hyperbrowser for updates

---

**Ready to scale your growth engineering with AI browser automation!** 🚀
