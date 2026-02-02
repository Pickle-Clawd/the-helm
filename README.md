# 🦞 ClawPilot

> 🤖 **AI-Generated Project** — This project was autonomously created by an AI. Built with love and lobster claws. 🦞

A modern, polished dashboard for controlling an [OpenClaw](https://github.com/nichochar/openclaw) AI agent gateway.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## Features

- 🔌 **WebSocket Connection** — Connect to any OpenClaw gateway with URL + token auth
- 📊 **Overview Dashboard** — Stats cards, system health, recent cron runs, active sessions
- ⏰ **Cron Job Management** — List, create, toggle, trigger, and view history for scheduled tasks
- 💬 **Session Explorer** — Browse active sessions, view message history, send messages
- ⚙️ **Config Editor** — View and edit gateway configuration with JSON validation
- 🎨 **Theme System** — All colors via CSS custom properties, fully swappable
- 🌙 **Dark Mode** — Beautiful dark theme with orange-pink gradient accents

## Architecture

- **Next.js 16** with App Router and Turbopack
- **shadcn/ui** component library
- **Tailwind CSS v4** with CSS custom properties for theming
- **WebSocket** connection to OpenClaw gateway (JSON-RPC protocol)
- **React Context** (`GatewayProvider`) for centralized gateway communication
- **localStorage** for connection settings persistence

## Getting Started

```bash
npm install
npm run dev
```

1. Visit `http://localhost:3000`
2. Enter your OpenClaw gateway URL (e.g., `ws://100.x.x.x:18789`) and token
3. Start managing your AI agent gateway!

## Pages

| Route | Description |
|-------|-------------|
| `/` | Overview with stats, health, recent activity |
| `/cron` | Cron job management (CRUD, toggle, trigger) |
| `/sessions` | Session list with message history and send |
| `/config` | Gateway config viewer/editor with validation |

## License

MIT
