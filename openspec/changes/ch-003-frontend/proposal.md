# Proposal: CH-003 — Frontend Configuration

## Intent

The frontend is currently greenfield (0% ready). This change sets up complete React + Vite infrastructure with TypeScript strict mode, Tailwind CSS, ESLint, Prettier, and Feature-Sliced Design structure. Required foundation for all subsequent frontend features (CH-004, CH-023, CH-031, CH-040, CH-041).

## Scope

### In Scope
- Core config files: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.cjs`, `.eslintrc.json`, `.prettierrc`
- React entry points: `index.html`, `src/main.tsx`, `src/App.tsx`
- FSD folder structure: `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`
- Environment variables: `.env.example` with `API_URL`, `VITE_API_URL`
- npm scripts: `dev`, `build`, `preview`, `lint`, `type-check`, `format`, `format:check`
- Git configuration: `.gitignore`
- All dependencies: React 18+, TypeScript 5+, Vite 5+, TanStack Query, TanStack Form, Zustand, Axios, Tailwind CSS, recharts, MercadoPago.js

### Out of Scope
- API client implementation (full interceptors) — foundation with baseURL only
- Authentication UI components — CH-020 (change-auth)
- Global state setup (Zustand stores) — CH-004
- Page components — respective feature changes
- Tailwind theme customization — per-feature configuration

## Approach

**Full Greenfield Setup**: Create all 14+ config files and FSD structure in single integrated sprint (3–4 hours).

- **Feature-Sliced Design (FSD)**: 6 layers with strict import rules (only from layers below)
- **TypeScript Strict Mode**: Non-negotiable per AGENTS.md; teams adapt, not relax
- **Vite API Proxy**: Server proxy configured to `http://localhost:8000` (backend)
- **Developer UX**: Fast HMR, clear error messages, eslint + prettier auto-fix from day 1
- **Path Aliases**: `@/app`, `@/pages`, `@/features`, `@/entities`, `@/shared` configured in vite + tsconfig

## Affected Areas

| Area | Type | Description |
|------|------|-------------|
| `frontend/package.json` | NEW | Dependencies, scripts, metadata |
| `frontend/vite.config.ts` | NEW | Build config, API proxy, HMR, aliases |
| `frontend/tsconfig.json` | NEW | Strict mode, path aliases, lib targets |
| `frontend/tailwind.config.ts` | NEW | Styling config, content paths |
| `frontend/postcss.config.cjs` | NEW | Tailwind plugin integration |
| `frontend/.eslintrc.json` | NEW | Linting rules (React, TypeScript, A11y) |
| `frontend/.prettierrc` | NEW | Formatting rules (2-space, 100 char line) |
| `frontend/index.html` | NEW | Entry HTML, root div |
| `frontend/src/main.tsx` | NEW | React root render |
| `frontend/src/App.tsx` | NEW | Root component (placeholder) |
| `frontend/src/{app,pages,widgets,features,entities,shared}/` | NEW | FSD layer directories |
| `frontend/.env.example` | NEW | Environment variables template |
| `frontend/.gitignore` | NEW | Node/Vite exclusions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dependency version conflicts | Medium | Fresh install with npm 9+, run `npm list`, validate peer deps |
| Vite API proxy fails | Medium | Test `server.proxy` config, curl verification to `localhost:8000` |
| Path aliases not resolved | High | Configure identically in `vite.config.ts` + `tsconfig.json`, test build |
| TypeScript strict mode friction | Low | Intentional constraint per architecture; document gotchas |

## Rollback Plan

- **Revert command**: `git checkout frontend/`
- **Time**: <1 minute
- **No backend changes** required
- **No environment changes** required

## Dependencies

- ✅ CH-000 (Scaffolding) — folder structure prerequisite
- ✅ CH-002 (Database) — backend at `http://localhost:8000`
- ✅ CH-020 (Auth) — JWT foundation ready

## Success Criteria

- [ ] `npm install` completes, 0 vulnerabilities
- [ ] `npm run dev` starts at `http://localhost:5173` with HMR working
- [ ] `npm run build` produces bundle without errors
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run type-check` shows 0 TypeScript errors
- [ ] `npm run format:check` passes
- [ ] Path aliases resolve in IDE and runtime
- [ ] API proxy to `localhost:8000` operational
- [ ] FSD structure complete with index files
- [ ] `.env.example` includes all required vars
- [ ] TypeScript strict mode enabled, no implicit any
- [ ] ESLint + Prettier rules aligned with AGENTS.md
