# Repository Guidelines

## Development Guidelines

- Plan TODOs
- Implement features
- Write tests (if needed)
- Check code quality
- Document changes
- Commit

## Project Structure & Module Organization

- `apps/web/`: React + Vite + TypeScript frontend. Entry: `src/main.tsx`, app: `src/App.tsx`.
- `apps/api/`: Hono + TypeScript backend. Entry: `src/index.ts`. Serves API and, in production, static frontend.
- `apps/api/scripts/copy-static.mjs`: Copies `apps/web/dist` → `apps/api/dist/public` during build.
- Root: `package.json` (workspaces + scripts), `Dockerfile`, `.dockerignore`, `.gitignore`.

## Build, Test, and Development Commands

- `npm run dev`: Runs web (Vite) and api (Hono) together.
- `npm run dev:web`: Frontend only at `http://localhost:5173`.
- `npm run dev:api`: Backend only at `http://localhost:3000`.
- `npm run build`: Builds web then api, copying web assets into api.
- `npm run start`: Runs built api (serves API and built frontend).
- Docker: `docker build -t ocha:prod .` then `docker run -p 3000:3000 ocha:prod`.

## Coding Style & Naming Conventions

- Language: TypeScript (strict). Indent: 2 spaces. Use semicolons consistently.
- React components: PascalCase filenames (e.g., `UserCard.tsx`). Variables/functions: camelCase. Env vars: UPPER_SNAKE_CASE.
- Prefer hooks and functional components; avoid default exports for components.
- Optional (recommended): ESLint + Prettier; keep imports sorted and unused code removed.

## Testing Guidelines

- Current repo has no tests. When adding:
  - Framework: Vitest (web) and Vitest/Node for api; name files `*.test.ts(x)`.
  - Layout: colocate near source or under `__tests__/`.
  - Scripts: add `"test"` in each package; run via `npm run test -w apps/web`.

## Commit & Pull Request Guidelines

- Use Conventional Commits: `feat(scope): ...`, `fix: ...`, `chore(docker): ...`.
- PRs: include a clear description, screenshots for UI changes, steps to verify, and linked issues.
- Keep changes focused; update docs when user-facing behavior or commands change.

## Security & Configuration Tips

- Env files: `.env` is ignored. Add `.env.example` for documented variables (e.g., `PORT`).
- Production serves static files from `apps/api/dist/public`; avoid serving source maps externally unless needed.
