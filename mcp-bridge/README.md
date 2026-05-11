# High Story MCP - Agent Orchestrator

The official [Model Context Protocol](https://modelcontextprotocol.io) bridge for **High Story**. This package enables AI agents (like Claude Desktop and Antigravity) to autonomously execute social media campaigns and manage multilingual content.

## 🚀 Quick Start (Recommended)

One command to configure the MCP server and install the Agent Skill:

```bash
npx highstory-mcp setup
```

## 🛠️ Features

- **Zero-Config Setup**: Automatic detection and modification of `claude_desktop_config.json`.
- **Automatic Skill Injection**: Installs the `highstory-social-media-manager` skill for supported agents.
- **WebSocket Bridge**: Connects local LLMs to the High Story Cloud infrastructure via secure WebSockets.
- **Graceful Lifecycle**: Handles reconnections and clean shutdowns.

## 📦 Developer Installation

If you prefer to run from source or contribute:

```bash
git clone https://github.com/7figures007/highstory-social-media-manager
cd packages/highstory-mcp
npm install
npm run build
node . setup
```

## 🔧 Tools Available

| Tool | Description |
| :--- | :--- |
| `execute_campaign` | Transform high-level briefs into cross-platform strategies. |
| `publish_post` | Direct publishing to Instagram, LinkedIn, and Facebook. |
| `generate_authority_article` | Create 2000+ word SEO/GEO optimized articles. |
| `get_workspace_stats` | Real-time performance audits of your brands. |

## 🛡️ Requirements

- **Node.js**: v18.0.0 or higher.
- **High Story API Token**: Get yours at [app.highstory.io/settings/api](https://app.highstory.io/settings/api).

## 📄 License

MIT © [7figures](https://github.com/7figures007)
