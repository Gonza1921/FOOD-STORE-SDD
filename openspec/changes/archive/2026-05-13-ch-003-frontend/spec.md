# Specification: CH-003 — Frontend Configuration

## PURPOSE

The frontend specification defines complete React + Vite infrastructure required for FOOD STORE development. This spec establishes the foundation for all frontend work (components, features, state management, styling). This is a FULL SPEC (no prior frontend spec exists).

---

## REQUIREMENTS

### Core Infrastructure — RFC 2119

| ID | Requirement | RFC 2119 | Notes |
|----|-------------|---------|-------|
| FE-001 | React framework installed, v18+ | MUST | With react-dom, react-router-dom |
| FE-002 | TypeScript strict mode enabled | MUST | No implicit any, full type coverage |
| FE-003 | Vite bundler configured, v5+ | MUST | Dev server at localhost:5173 |
| FE-004 | Tailwind CSS utility framework, v3+ | MUST | Content scanning enabled |
| FE-005 | ESLint configured with React + TS rules | MUST | Auto-fix on save available |
| FE-006 | Prettier code formatter configured | MUST | 2-space indent, 100 char line length |
| FE-007 | npm package manager, v9+ | MUST | Reproducible installs via package-lock.json |
| FE-008 | All npm scripts operational | MUST | dev, build, preview, lint, type-check, format, format:check |
| FE-009 | API proxy to backend configured | MUST | /api → http://localhost:8000 |
| FE-010 | Axios HTTP client with baseURL | MUST | Ready for interceptors in CH-004 |
| FE-011 | FSD folder structure created | MUST | 6 layers: app, pages, widgets, features, entities, shared |
| FE-012 | Path aliases configured | MUST | @/app, @/pages, @/features, @/entities, @/shared working in IDE + runtime + build |
| FE-013 | Environment variables loaded | SHOULD | VITE_API_URL in .env.example |
| FE-014 | Hot Module Replacement (HMR) working | SHOULD | Dev server instant feedback <500ms |
| FE-015 | Build produces <5MB gzipped | MAY | Performance optimization (CH-040+) |

### npm Scripts Specification

| Script | Command | Expected Output |
|--------|---------|-----------------|
| `dev` | `vite` | Server at http://localhost:5173 with HMR |
| `build` | `vite build` | Output in frontend/dist/ |
| `preview` | `vite preview` | Serves dist/ locally |
| `lint` | `eslint src --fix` | 0 errors |
| `type-check` | `tsc --noEmit` | 0 TypeScript errors |
| `format` | `prettier --write src` | 2-space indent, 100 char lines |
| `format:check` | `prettier --check src` | Verify formatting pass |

### FSD Folder Structure — Mandatory

```
frontend/src/
├── app/                      # Providers, routing, global config
│   ├── App.tsx              # Root component
│   ├── Router.tsx           # React Router setup
│   └── providers.tsx        # TanStack Query + context providers
├── pages/                   # Page components (1:1 with routes)
│   ├── LoginPage.tsx        # Example (CH-010)
│   └── index.ts             # Barrel export
├── widgets/                 # Complex UI blocks (feature compositions)
│   ├── Header.tsx           # Navigation widget
│   ├── Sidebar.tsx          # Layout widget
│   └── index.ts             # Barrel export
├── features/                # User features (isolated, reusable)
│   ├── auth/                # Auth feature
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── products/            # Products feature
│   │   ├── components/
│   │   └── index.ts
│   └── index.ts             # Barrel export
├── entities/                # Domain models (types, validation)
│   ├── User.ts
│   ├── Product.ts
│   ├── Order.ts
│   └── index.ts
└── shared/                  # Utilities, generic components
    ├── api/
    │   ├── axiosClient.ts   # Axios instance + baseURL
    │   ├── endpoints.ts     # API route constants
    │   └── index.ts
    ├── components/          # Generic UI components
    │   ├── Button.tsx
    │   ├── Modal.tsx
    │   └── index.ts
    ├── hooks/               # Shared custom hooks
    ├── utils/               # Formatters, validators
    ├── styles/
    │   ├── globals.css      # Tailwind directives + global overrides
    │   └── index.css
    └── index.ts             # Barrel export
```

---

## SCENARIOS (Happy Path + Edge Cases)

### Scenario: Fresh clone → dev server running

- GIVEN fresh clone of FOOD-STORE-SDD
- WHEN developer runs `npm install && npm run dev` in frontend/
- THEN npm installs all dependencies without vulnerabilities
- AND dev server starts at http://localhost:5173 with HMR
- AND no TypeScript errors or ESLint warnings appear

### Scenario: Component with TypeScript strict mode

- GIVEN strict mode enabled (FE-002)
- WHEN developer creates ProductCard.tsx with props
- THEN component MUST have explicit type annotations
- AND `npm run type-check` passes with 0 errors
- AND IDE shows type hints and autocomplete

### Scenario: Path alias import resolution

- GIVEN path aliases configured (@/shared, @/features)
- WHEN developer imports `import { formatPrice } from '@/shared/utils'`
- THEN import resolves correctly in IDE (go-to-definition, autocomplete)
- AND import works at runtime AND in production build

### Scenario: API requests proxied to backend

- GIVEN dev server running at localhost:5173
- WHEN frontend makes request to `/api/v1/auth/login`
- THEN request proxies to http://localhost:8000/api/v1/auth/login (no CORS)
- AND response arrives from backend successfully

### Scenario: Code formatting and linting pass

- GIVEN Prettier configured (2-space, 100 char)
- WHEN developer runs `npm run lint && npm run format`
- THEN all files formatted consistently
- AND `npm run format:check` passes (0 files need formatting)
- AND ESLint rules align with AGENTS.md

### Scenario: Production build optimization

- GIVEN `npm run build` executed
- THEN output in frontend/dist/ with minified + tree-shaken assets
- AND assets hashed for cache-busting
- AND `npm run preview` serves dist/ at localhost:4173 without errors

### Scenario: New developer environment setup

- GIVEN .env.example contains template vars (VITE_API_URL, VITE_MERCADOPAGO_PUBLIC_KEY)
- WHEN new developer copies .env.example → .env.local
- THEN they see clear variable names and documentation
- AND dev server knows backend location without manual config

---

## ACCEPTANCE CRITERIA

- [ ] `npm install` completes with 0 vulnerabilities
- [ ] `npm run dev` starts at http://localhost:5173 with HMR
- [ ] `npm run build` produces optimized dist/ without errors
- [ ] `npm run lint` passes (0 errors)
- [ ] `npm run type-check` passes (0 errors, strict mode)
- [ ] `npm run format:check` passes (pre-formatted code)
- [ ] Path aliases (@/app, @/features, @/shared, @/entities) resolve in IDE + runtime + build
- [ ] API proxy configured: localhost:5173 → localhost:8000
- [ ] FSD structure complete with 6 layers + barrel exports
- [ ] TypeScript strict mode enabled, no implicit any
- [ ] ESLint + Prettier rules align with AGENTS.md standards
- [ ] .env.example includes VITE_API_URL + VITE_MERCADOPAGO_PUBLIC_KEY
- [ ] HMR responds within <500ms on file save
- [ ] No console warnings on `npm run dev` startup
- [ ] Git history: spec.md → proposal.md → exploration.md (audit trail)

---

## NOTES

- **Out of Scope**: Storybook, vitest, e2e tests, i18n (defer to later changes)
- **Performance**: Bundle optimization tracking starts CH-040+ (payment integration)
- **Accessibility**: ESLint a11y plugin installed; specific implementations per-feature
- **Future**: CI/CD pipeline, workspace scripts for monorepo commands (post-launch)
