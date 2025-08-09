# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ocha** is a full-stack TypeScript application with AI chat functionality, built using React + Vite frontend and Hono backend. The project uses npm workspaces with a monorepo structure under `apps/*`.

## Architecture

- **Frontend** (`apps/web`): React 18 + TypeScript + Vite, integrates Vercel AI SDK
- **Backend** (`apps/api`): Hono + TypeScript + Node.js with modular architecture
  - Modular route handlers separated by functionality
  - Centralized configuration management
  - Global error handling middleware
  - Graceful server shutdown utilities
- **AI Integration**: Uses Vercel AI SDK with OpenAI for chat functionality via `/api/ai/chat`
- **Static Assets**: Web build output copied to `apps/api/dist/public` for unified deployment

## Key Development Commands

```bash
# Development (runs both frontend and backend concurrently)
npm run dev

# Individual development servers  
npm run dev:web    # Frontend at http://localhost:5173
npm run dev:api    # Backend at http://localhost:3000

# Production build and start
npm run build      # Builds web then api with static file copy
npm run start      # Runs built api server

# Workspace-specific commands
npm run <command> -w apps/web
npm run <command> -w apps/api
```

## Code Conventions

- **Language**: TypeScript with ES modules (`type: "module"` in api)
- **Style**: 2-space indentation, semicolons, strict TypeScript
- **Naming**: 
  - React components: PascalCase files (`UserCard.tsx`)
  - Variables/functions: camelCase  
  - Environment variables: UPPER_SNAKE_CASE
- **React**: Functional components with hooks, avoid default exports for components
- **Commits**: Conventional Commits format (`feat(scope): description`)

## Project Structure

```
apps/
├── web/           # React frontend
│   ├── src/
│   │   ├── main.tsx     # Entry point
│   │   └── App.tsx      # Main component
│   └── package.json
├── api/           # Hono backend  
│   ├── src/
│   │   ├── index.ts          # Entry point
│   │   ├── config/
│   │   │   └── index.ts      # Configuration management
│   │   ├── routes/
│   │   │   ├── health.ts     # Health check endpoint
│   │   │   ├── api.ts        # Basic API endpoints
│   │   │   └── chat.ts       # AI chat endpoint
│   │   ├── middleware/
│   │   │   └── error.ts      # Global error handling
│   │   └── utils/
│   │       └── server.ts     # Server lifecycle management
│   ├── scripts/
│   │   └── copy-static.mjs   # Copies web/dist to api/dist/public
│   └── package.json
└── Dockerfile     # Multi-stage production build
```

## Development Workflow

Follow this sequence when developing:

1. **Plan** - Use TodoWrite tool to plan complex tasks
2. **Implementation** - Implement following coding conventions
3. **Error Check** - Run `npm run build` to verify no build errors
4. **Refactor** - Improve and optimize code
5. **Testing** - Write tests for significant functionality (Vitest recommended)
6. **Commit** - Commit using Conventional Commits format

### Task Completion Checklist

- [ ] Plan TODOs for complex tasks
- [ ] Implement following coding conventions
- [ ] Run `npm run build` to verify no build errors
- [ ] Refactor and optimize code
- [ ] Write tests if adding significant functionality
- [ ] Use Conventional Commits format (`feat(scope): description`)
- [ ] Update documentation for user-facing changes

## Testing (When Added)

- **Framework**: Vitest for both packages
- **Files**: `*.test.ts(x)` colocated or in `__tests__/`
- **Commands**: Add `"test"` scripts, run via `npm run test -w apps/web`