# Exploration — ch-003-frontend

## Summary
CH-003 is a greenfield frontend configuration with clear, well-defined scope. No architectural blockers; all dependencies and requirements documented in ROADMAP_COMPLETO.md and AGENTS.md. Ready for immediate proposal.

---

## Current State

### Frontend Directory
```
frontend/
├── .env.example       # 2 lines: VITE_API_URL, VITE_MP_PUBLIC_KEY
├── .gitkeep
└── (everything else missing)
```

**Status**: 0% ready
- No `package.json` (dependencies not declared)
- No build/dev tooling configured (Vite, TypeScript, Tailwind, etc.)
- No `src/` folder structure (FSD layers missing)
- No code quality tools (ESLint, Prettier)

### Dependency Status
- ✅ **Backend ready**: CH-001, CH-002 completed; FastAPI running on http://localhost:8000
- ✅ **Auth ready**: JWT + RBAC implemented in backend
- ✅ **Database ready**: 13 tables, Alembic migrations, seed data applied
- ⏳ **Frontend**: This change; blocks CH-004 (Zustand stores) and CH-023 (catalog)

---

## Affected Areas

| Component | File | Status | Purpose |
|-----------|------|--------|---------|
| **Dependency Manifest** | `package.json` | ❌ | All 9 core dependencies: React 18+, TypeScript 5+, Vite 5+, TanStack Query/Form, Zustand, Tailwind, Axios, Recharts, MercadoPago SDK |
| **Bundler Config** | `vite.config.ts` | ❌ | Vite with React plugin, path aliases (@/app, @/features), API proxy to backend, port 5173 |
| **TypeScript Config** | `tsconfig.json` | ❌ | Strict mode, ES2020 target, JSX react-jsx, path aliases, noUnusedLocals/Params |
| **Styling Config** | `tailwind.config.ts` | ❌ | Tailwind theme, colors (primary, secondary), @tailwindcss/forms plugin |
| **PostCSS Config** | `postcss.config.cjs` | ❌ | Tailwind + autoprefixer |
| **Code Quality** | `.eslintrc.json` | ❌ | ESLint rules: react/hooks, @typescript-eslint/recommended |
| **Code Quality** | `.prettierrc` | ❌ | Prettier (2-space indent, 100 char line) |
| **HTML Entry** | `index.html` | ❌ | Vite entry point with root div + main.tsx script |
| **React Entry** | `src/main.tsx` | ❌ | Mount App to #root |
| **Root Component** | `src/app/App.tsx` | ❌ | QueryClientProvider + BrowserRouter + Routes |
| **FSD Layers** | `src/app/`, `src/pages/`, etc. | ❌ | 6 FSD layers: app (providers), pages, widgets, features, entities, shared |
| **API Client** | `src/shared/api/axios.ts` | ❌ | Axios instance, baseURL = VITE_API_URL or http://localhost:8000/api/v1 |
| **Styles** | `src/shared/styles/globals.css` | ❌ | @import Tailwind directives |
| **Env Variables** | `.env.example` | ⚠️ | Has VITE_API_URL + VITE_MP_PUBLIC_KEY; needs descriptions |
| **Git Ignore** | `.gitignore` | ❌ | Exclude node_modules/, dist/, .env, .DS_Store, .vscode/, etc. |

---

## Approaches

### Option A: Full Greenfield Setup (Recommended ✅)

**Description**: Create ALL configuration files + FSD structure in one integrated sprint (~3-4 hours total).

**Pros**:
- Complete, production-ready foundation on day one
- All configs aligned with AGENTS.md conventions
- Path aliases configured and tested early (@/app, @/features, etc.)
- No rework later; foundation is solid
- Clear dependency versions that work together (tested compatibility)
- HMR, Tailwind utilities, ESLint all available for next changes (CH-004, CH-023)

**Cons**:
- Larger chunk of work (but well-scoped and straightforward)
- More files to create (but each is simple, well-documented)
- No incremental verification (all-or-nothing at setup)

**Effort**: **Medium** (~3-4 hours)
- Setup + dependencies: 30 min
- Configs (Vite, TypeScript, Tailwind, ESLint, Prettier): 1 hour
- FSD folder structure + root components: 1 hour
- Testing (npm install, npm run dev, type-check): 30 min
- Commit: 10 min

---

### Option B: Minimal Bootstrap + Iterate

**Description**: Create only `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/App.tsx`, `src/main.tsx`. Skip Tailwind, ESLint, Prettier for follow-up PR.

**Pros**:
- Faster initial "dev server works" milestone (1-1.5 hours)
- Easier to catch integration issues early (React + Vite + backend API)
- Reduced initial scope for rapid feedback

**Cons**:
- Creates technical debt: no code quality tooling
- Slower development experience: no Tailwind utilities, no linting
- Two-phase setup: need follow-up PR for linting + styling
- **Violates project requirements**: AGENTS.md explicitly states "ESLint + Prettier configured"
- **Blocks CH-004**: Zustand stores depend on path aliases and strict TypeScript

**Effort**: **Low** (~1.5-2 hours) + follow-up work (2-3 hours) = **Higher total**

---

## Recommendation

### 🎯 **Option A: Full Greenfield Setup**

**Why this choice**:

1. **ROADMAP_COMPLETO.md specifies all 9 core dependencies upfront** (not optional):
   - React 18+, TypeScript 5+, Vite 5+
   - TanStack Query 5+, TanStack Form, Zustand 4+
   - Tailwind CSS 3+, Axios, Recharts, MercadoPago SDK

2. **AGENTS.md mandates tooling from project start**:
   - "ESLint + Prettier configured"
   - "TypeScript end-to-end" (strict mode)
   - "Tailwind CSS utility-first"
   - No exceptions; this is project policy

3. **CH-004 (Zustand stores) depends on CH-003 foundation**:
   - Path aliases must work (@/shared, @/features)
   - TypeScript strict mode must be active
   - Vite dev server must have HMR
   - If missing, CH-004 gets blocked or requires rework

4. **3 hours for Sprint 0 infrastructure is justified**:
   - DevOps work, not business logic
   - Investment pays off immediately (cleaner downstream)
   - One integrated push is cleaner than piecemeal

5. **Proven stack**: React 18 + Vite + TypeScript + Tailwind is industry standard for 2025. All versions compatible and well-tested.

**Concrete deliverables after Option A**:
- ✅ `npm install` completes without errors (all peer deps resolved)
- ✅ `npm run dev` launches dev server on http://localhost:5173 with HMR
- ✅ TypeScript `strict: true` compiles cleanly
- ✅ Tailwind CSS classes available in components (e.g., `className="bg-blue-500 p-4"`)
- ✅ `src/shared/api/axios.ts` with centralized HTTP client
- ✅ API baseURL points to `http://localhost:8000/api/v1`
- ✅ `src/app/App.tsx` wrapping React Router + TanStack Query providers
- ✅ FSD folder structure complete and ready for features
- ✅ ESLint + Prettier enforce code style
- ✅ `npm run lint`, `npm run format`, `npm run type-check` all work

---

## Risks & Mitigations

### Risk 1: Dependency Version Conflicts
**Likelihood**: Medium  
**Severity**: High (blocks npm install)  
**Mitigation**: 
- Use npm 9+ (resolves peer deps automatically)
- Pin exact versions in package.json for known-stable combinations
- Test fresh `npm install` on clean environment after creation
- MercadoPago SDK: requires explicit `@mercadopago/sdk-js@^2.6.0` (peer deps minimal)

---

### Risk 2: Vite API Proxy to Backend Fails
**Likelihood**: Low  
**Severity**: Medium (HMR works but API calls fail in dev)  
**Mitigation**:
- Configure `server.proxy` in vite.config.ts to forward `/api/` → `http://localhost:8000`
- Test during setup: `curl http://localhost:5173/api/v1/docs` (should proxy to backend Swagger)
- If proxy fails: check backend is running on 8000, verify no port conflicts

---

### Risk 3: Path Aliases Not Resolved at Runtime
**Likelihood**: Low  
**Severity**: High (module imports fail)  
**Mitigation**:
- Configure identically in **both** files:
  - `vite.config.ts`: `resolve.alias`
  - `tsconfig.json`: `compilerOptions.paths`
- Test one import immediately: `import App from '@/app/App'` in main.tsx
- If fails: check paths are absolute, slashes consistent

---

### Risk 4: TypeScript Strict Mode Too Aggressive
**Likelihood**: Low  
**Severity**: Low (warnings during development)  
**Mitigation**:
- This is **INTENTIONAL** per AGENTS.md requirement ("end-to-end typesafety")
- Strict mode catches bugs at compile-time, not runtime
- Justification: e-commerce platform requires reliability
- Non-negotiable; no pushback allowed

---

### Risk 5: MercadoPago SDK Bundle Size
**Likelihood**: Low  
**Severity**: Low (bundle optimization, not blocker)  
**Mitigation**:
- SDK adds ~15KB gzipped to bundle
- Not a critical issue for CH-003 (pure setup)
- Handle lazy-loading in CH-040 (MercadoPago integration), not here
- Include but document in README

---

## Key Configuration Files (Summary)

### `package.json`
```json
{
  "name": "food-store-frontend",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0",
    "@tanstack/react-query": "^5.45.0",
    "@tanstack/react-form": "^0.33.0",
    "zustand": "^4.5.0",
    "axios": "^1.7.0",
    "tailwindcss": "^3.4.0",
    "recharts": "^2.12.0",
    "@mercadopago/sdk-js": "^2.6.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/node": "^20.12.0",
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.4.0",
    "@typescript-eslint/parser": "^7.4.0",
    "eslint-plugin-react": "^7.34.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.2.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@tailwindcss/forms": "^0.5.7"
  }
}
```

### `vite.config.ts`
- React plugin + fast refresh
- Path aliases (@/app, @/features, @/shared, etc.)
- API proxy: `/api/` → `http://localhost:8000`
- Dev server on port 5173

### `tsconfig.json`
- `strict: true` (all strictness flags)
- `target: ES2020`, `jsx: react-jsx`
- Path aliases matching vite.config.ts
- `noUnusedLocals`, `noUnusedParameters` enabled

### `tailwind.config.ts`
- Content pattern: `./src/**/*.{js,ts,jsx,tsx}`
- Custom colors: primary (#10b981), secondary (#f59e0b)
- Tailwind Forms plugin for better form styling

### `.eslintrc.json`
- Parser: @typescript-eslint/parser
- Plugins: react, react-hooks, @typescript-eslint
- Rules: recommended + React hooks rules

### `.prettierrc`
- Indent: 2 spaces
- Line length: 100 characters
- Semicolons: true

---

## Dependencies

### Upstream
- **CH-000** (scaffolding structure): ✅ Already completed
  - Need: `/frontend` folder exists

### Blocking Downstream
- **CH-004** (Zustand stores): Depends on CH-003
  - Need: Path aliases working, TypeScript strict mode, Vite dev server
- **CH-023** (catalog frontend): Depends on CH-003
  - Need: TanStack Query configured, Tailwind ready

### Can Start Immediately
Yes — all prerequisites met. CH-000 already done, backend (CH-001, CH-002) ready.

---

## Complexity & Effort

| Phase | Estimate | Notes |
|-------|----------|-------|
| Setup + dependencies | 30 min | npm setup, package versions |
| Configs (Vite, TS, Tailwind, ESLint, Prettier) | 1 hour | Straightforward; all files simple |
| FSD structure + root components | 1 hour | 6 folders + 4 files (App, main, axios, globals.css) |
| Testing (install, dev, type-check) | 30 min | Verify everything works together |
| Commit | 10 min | One atomic commit |
| **Total** | **~3-4 hours** | **Includes buffer for troubleshooting** |

---

## Ready for Proposal?

### ✅ **YES** — This change is ready for proposal.

**Justification**:
1. **Clear scope**: All files, configs, and dependencies listed above
2. **No unknowns**: ROADMAP_COMPLETO.md + AGENTS.md define all requirements
3. **No blockers**: CH-000 done, backend ready, proven stack
4. **Low complexity**: Standard React + Vite setup (industry standard)
5. **Well-estimated**: 3 hours with clear breakdown
6. **Production-ready**: No tech debt; full tooling from day one

**Next phase**: **Proposal** should define acceptance criteria (all npm commands work, ts strict, HMR, path aliases tested, dev server responsive).

---

## Notes for Orchestrator

- This is **Sprint 0 infrastructure work** (DevOps category)
- **Critical path**: Required before CH-004, CH-023, CH-031, and all frontend features
- **One atomic commit**: All files together (not split across multiple PRs)
- **Testing strategy**: Manual verification of npm commands + Vite dev server response time
- **Documentation**: README.md update with frontend setup instructions (npm install, npm run dev, npm run lint, etc.)
