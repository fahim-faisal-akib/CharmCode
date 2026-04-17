# OpenCode — AI Coding Agent

An open-source, self-hosted AI coding agent with a web dashboard. Works like Claude Code, but lets you use **any model available on OpenRouter** — GPT-4o, Claude, Llama, Mistral, Gemini, DeepSeek, and more.

## Features

- **Any model via OpenRouter** — add models by their ID (e.g. `openai/gpt-4o`, `meta-llama/llama-3.1-70b-instruct`)
- **Up to 5 API keys** with automatic fallback — if key #1 fails, key #2 continues seamlessly
- **File & folder creation** — the agent creates real files in your project directory
- **Project file explorer** — browse and view project files in the dashboard
- **Conversation history** — multi-turn context-aware coding sessions
- **Dark, developer-focused UI** — built for coding workflows

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org) v18 or higher
- An [OpenRouter](https://openrouter.ai) account and API key

### Linux / macOS
```bash
chmod +x start.sh
./start.sh
```

### Windows
```bat
start.bat
```

### Manual start
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Terminal 1 — backend
cd backend && npm start

# Terminal 2 — frontend
cd frontend && npm start
```

Open **http://localhost:3000** in your browser.

## Setup

1. **Add API Keys** → Go to Settings → paste your OpenRouter API key(s) into slot #1 (required). Slots 2–5 are backup keys.
2. **Add Models** → In Settings → Models, enter a model ID like `openai/gpt-4o` and click Add. Find all available models at [openrouter.ai/models](https://openrouter.ai/models).
3. **Set Project Directory** → Enter the absolute path to your project folder (e.g. `/home/user/my-app`). The agent will create files here.
4. **Start coding** → Go to the Chat tab and ask OpenCode to build something.

## How API Key Fallback Works

- Keys are tried in order: #1 → #2 → #3 → #4 → #5
- If a key fails (rate limited, expired, quota exceeded), the next valid key automatically takes over
- The agent picks up from the exact same point — no lost context or repeated work
- The dashboard shows which key number was used for each response

## Example Prompts

```
Create a React todo app with local storage
Build a REST API with Express and MongoDB
Write a Python script to scrape news headlines
Create a landing page for a SaaS product
Fix the bug in my authentication middleware
Add TypeScript types to my existing JS file
```

## Project Structure

```
opencode/
├── backend/
│   ├── server.js          # Express server entry
│   ├── config.json        # Your settings (auto-created, gitignored)
│   ├── routes/
│   │   ├── settings.js    # API key & model management
│   │   ├── agent.js       # AI agent endpoint
│   │   └── files.js       # File system operations
│   ├── services/
│   │   └── agent.js       # OpenRouter calls + fallback logic
│   └── utils/
│       └── config.js      # Config read/write helpers
└── frontend/
    └── src/
        ├── store/         # Zustand global state
        ├── pages/         # Chat, Settings, Files
        └── components/    # Sidebar
```

## Supported Model Examples

| Provider | Model ID |
|----------|----------|
| OpenAI | `openai/gpt-4o` |
| OpenAI | `openai/gpt-4o-mini` |
| Anthropic | `anthropic/claude-3.5-sonnet` |
| Meta | `meta-llama/llama-3.1-70b-instruct` |
| Google | `google/gemini-pro-1.5` |
| Mistral | `mistralai/mistral-large` |
| DeepSeek | `deepseek/deepseek-coder` |
| Any local model | via OpenRouter-compatible endpoints |

## License

MIT
