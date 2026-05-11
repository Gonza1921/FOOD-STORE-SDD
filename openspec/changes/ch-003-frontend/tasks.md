# Tasks: CH-003 — Frontend Configuration

## Phase 1: Foundation & Config Setup (1.5 hours)

- [ ] **1.1** Create `frontend/package.json` with dependencies
  - React 18+, TypeScript 5+, Vite 5+, TanStack Query/Form, Zustand, Axios, Tailwind, recharts, mercadopago.js
  - Dev: @vitejs/plugin-react, @types/react, eslint, prettier, typescript
  - Scripts: dev, build, preview, lint, type-check, format, format:check
  - Verify: `npm install` → 0 vulnerabilities, package-lock.json created

- [ ] **1.2** Create `frontend/tsconfig.json` with strict mode
  - `"strict": true, "noImplicitAny": true, "strictNullChecks": true`
  - Path aliases: `@/app`, `@/pages`, `@/widgets`, `@/features`, `@/entities`, `@/shared`
  - Target: ES2020, module: ESNext, lib: [ES2020, DOM, DOM.Iterable]
  - Verify: `npm run type-check` → 0 errors with empty src/

- [ ] **1.3** Create `frontend/vite.config.ts`
  - React plugin: `@vitejs/plugin-react`
  - Path aliases (same as tsconfig.json)
  - API proxy: `/api → http://localhost:8000/api`
  - HMR enabled, source maps enabled
  - Verify: `npm run build` → dist/ created

- [ ] **1.4** Create `frontend/tailwind.config.ts` and `postcss.config.cjs`
  - Tailwind content: `["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`
  - Extend theme (not replace): primary, secondary, accent colors
  - PostCSS: tailwindcss, autoprefixer
  - Verify: Tailwind classes in HTML → styles applied

- [ ] **1.5** Create `frontend/.eslintrc.json`
  - Extends: @typescript-eslint/recommended, react/recommended, react-hooks/recommended
  - Rules: no-implicit-any, no-unused-vars, react-hooks/rules-of-hooks, import/no-cycle
  - Include: eslint-plugin-jsx-a11y
  - Verify: `npm run lint` → 0 errors (empty src/ OK)

- [ ] **1.6** Create `frontend/.prettierrc`
  - 2-space indentation, 100 char line length, semicolons true, trailingComma: es5
  - Verify: `npm run format:check` → passes (empty src/ OK)

- [ ] **1.7** Create `frontend/.env.example`
  - VITE_API_URL=http://localhost:8000/api/v1
  - VITE_MERCADOPAGO_PUBLIC_KEY=YOUR_KEY
  - VITE_APP_NAME=FOOD STORE, VITE_APP_ENV=development
  - Create `frontend/vite.env.d.ts` for TypeScript autocomplete
  - Verify: IDE shows VITE_* in import.meta.env

- [ ] **1.8** Create `frontend/.gitignore`
  - node_modules, dist, .env.local, .DS_Store, *.log, .vscode, coverage
  - Verify: `git status` ignores build outputs

---

## Phase 2: React Entry Points (1 hour)

- [ ] **2.1** Create `frontend/index.html`
  - `<div id="root"></div>` entry point
  - `<script type="module" src="./src/main.tsx"></script>`
  - DOCTYPE, lang, meta charset, favicon (placeholder)
  - Verify: Browser loads HTML at localhost:5173 (blank OK)

- [ ] **2.2** Create `frontend/src/main.tsx`
  - Import React, ReactDOM, App
  - `ReactDOM.createRoot(document.getElementById('root')!).render(<App />)`
  - Verify: `npm run dev` → no console errors

- [ ] **2.3** Create `frontend/src/App.tsx`
  - Root component: `<Providers><Router /></Providers>`
  - Import Providers, Router
  - Placeholder JSX
  - Verify: Dev server shows content (no errors)

- [ ] **2.4** Create `frontend/src/app/` files
  - `app/App.tsx`: export root component
  - `app/providers.tsx`: QueryClientProvider + context setup
  - `app/Router.tsx`: placeholder for CH-023
  - `app/index.ts`: barrel export
  - Verify: `import { App } from '@/app'` works in IDE

- [ ] **2.5** Create `frontend/src/shared/styles/globals.css`
  - `@tailwind base; @tailwind components; @tailwind utilities;`
  - Global resets (if needed)
  - Import in main.tsx before React render
  - Verify: Tailwind classes work in components

---

## Phase 3: FSD Structure (1 hour)

- [ ] **3.1** Create `frontend/src/pages/`
  - Create placeholder pages: LoginPage.tsx, DashboardPage.tsx (export const)
  - Create `pages/index.ts` barrel export
  - Verify: `import { LoginPage } from '@/pages'` auto-completes in IDE

- [ ] **3.2** Create `frontend/src/widgets/`
  - Create Widget folders: Header/, Sidebar/ (each: component + index.ts)
  - Create `widgets/index.ts` barrel export
  - Verify: `import { Header } from '@/widgets'` works

- [ ] **3.3** Create `frontend/src/features/`
  - Create auth/ with: components/, hooks/, store.ts, index.ts
  - Create products/ with: components/, hooks/, store.ts, index.ts
  - Create `features/index.ts` barrel
  - Verify: `import { useAuth } from '@/features/auth'` resolves

- [ ] **3.4** Create `frontend/src/entities/`
  - Create: User.ts, Product.ts, Order.ts (type definitions only)
  - Create `entities/index.ts` barrel
  - Verify: `import type { User } from '@/entities'` works

- [ ] **3.5** Create `frontend/src/shared/` sublayers
  - Create: api/, components/, hooks/, utils/, types/, styles/
  - Each with index.ts barrel export
  - Create `shared/index.ts` main barrel
  - Verify: All nested paths resolve (@/shared/api, @/shared/components, etc.)

---

## Phase 4: Shared Layer Implementation (1 hour)

- [ ] **4.1** Create `frontend/src/shared/api/axiosClient.ts`
  - Axios instance: baseURL from VITE_API_URL or http://localhost:8000/api/v1
  - Interceptor stubs (TODO comments for CH-004)
  - Export as default
  - Verify: TypeScript strict mode passes

- [ ] **4.2** Create `frontend/src/shared/api/endpoints.ts`
  - API constants: AUTH.LOGIN, AUTH.LOGOUT, PRODUCTS.LIST, ORDERS.CREATE, etc.
  - Use as single source of truth (prevents typos)
  - Verify: `npm run type-check` passes

- [ ] **4.3** Create `frontend/src/shared/components/Button.tsx`
  - Interface ButtonProps, export Button component
  - Use TypeScript strict typing
  - Verify: `npm run lint` + `npm run type-check` pass

- [ ] **4.4** Create `frontend/src/shared/utils/` functions
  - formatters.ts: formatPrice(), formatDate() (stub functions with types)
  - validators.ts: validateEmail(), validatePassword() (stub functions)
  - Verify: All exported, type-check passes

---

## Phase 5: Validation & Integration (0.5 hours)

- [ ] **5.1** Verify all npm scripts work
  - `npm run dev` → server at localhost:5173 ✓
  - `npm run build` → dist/ created ✓
  - `npm run lint` → 0 errors ✓
  - `npm run type-check` → 0 errors ✓
  - `npm run format:check` → passes ✓

- [ ] **5.2** Verify path aliases resolve
  - IDE: type `@/` → autocomplete suggestions ✓
  - IDE: click import → go-to-definition works ✓
  - Runtime: dev server works with alias imports ✓
  - Build: `npm run build` succeeds ✓

- [ ] **5.3** Verify API proxy + Zustand ready
  - Proxy working: requests to /api route to backend ✓
  - Create placeholder Zustand store in features/auth/store.ts ✓
  - Verify store can be imported + used ✓

- [ ] **5.4** Verify TanStack Query wired
  - QueryClientProvider in providers.tsx ✓
  - App wrapped with provider ✓
  - Dev server starts without errors ✓

---

## Phase 6: Documentation & Cleanup (0.5 hours)

- [ ] **6.1** Create `frontend/README.md`
  - Setup: `npm install`
  - Dev: `npm run dev`
  - Build: `npm run build`
  - Scripts: lint, type-check, format

- [ ] **6.2** Verify all acceptance criteria from spec.md
  - [ ] npm install with 0 vulnerabilities
  - [ ] HMR <500ms
  - [ ] Strict TypeScript mode enabled
  - [ ] Path aliases in IDE + runtime + build
  - [ ] ESLint + Prettier rules per AGENTS.md
  - [ ] API proxy configured
  - [ ] FSD structure complete with barrels

- [ ] **6.3** Final git readiness
  - All frontend/ files staged
  - No changes outside frontend/
  - Ready for commit: `git add frontend/ && git commit -m "feat(ch-003): complete frontend configuration with React, Vite, Tailwind, FSD structure"`

---

## Summary

| Phase | Tasks | Duration | Focus |
|-------|-------|----------|-------|
| 1. Config | 1.1–1.8 (8) | 1.5h | Setup, dependencies, tooling |
| 2. Entry Points | 2.1–2.5 (5) | 1h | React root, providers |
| 3. FSD Structure | 3.1–3.5 (5) | 1h | 6 layers, barrels |
| 4. Shared | 4.1–4.4 (4) | 1h | API, utils |
| 5. Validation | 5.1–5.4 (4) | 0.5h | Wiring, npm scripts |
| 6. Cleanup | 6.1–6.3 (3) | 0.5h | Docs, acceptance, git |
| **TOTAL** | **24 tasks** | **~5h** | |

**Dependency order**: 1 → 2 → 3+4 (parallel) → 5 → 6
