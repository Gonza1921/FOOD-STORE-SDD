# FOOD STORE Frontend

Modern React 18+ frontend for FOOD STORE e-commerce platform. Built with TypeScript, Vite, Tailwind CSS, and a Feature-Sliced Design (FSD) architecture.

## Quick Start

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start dev server at http://localhost:5173
npm run dev
```

The dev server includes Hot Module Replacement (HMR) for instant feedback on code changes.

### Build

```bash
# Build for production
npm run build

# Output: frontend/dist/
```

### Preview Production Build

```bash
# Preview built application (after npm run build)
npm run preview
```

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev` | `vite` | Start dev server with HMR at localhost:5173 |
| `npm run build` | `tsc && vite build` | Compile TypeScript + build optimized production bundle |
| `npm run preview` | `vite preview` | Preview production build locally at localhost:4173 |
| `npm run lint` | `eslint src --ext .ts,.tsx` | Check code quality (ESLint) |
| `npm run format` | `prettier --write src/**/*.{ts,tsx,css}` | Format code automatically (Prettier) |
| `npm run format:check` | `prettier --check src/**/*.{ts,tsx,css}` | Verify code formatting without changes |
| `npm run type-check` | `tsc --noEmit` | Check TypeScript types without emitting output |

## Project Structure

```
frontend/src/
├── app/              # Application root, providers, routing
├── pages/            # Page components (1:1 with routes)
├── widgets/          # Complex UI compositions
├── features/         # Feature modules (auth, products, cart, etc.)
├── entities/         # Domain models (types, constants)
└── shared/           # Shared utilities, components, API client
    ├── api/          # Axios client + endpoint constants
    ├── components/   # Reusable UI components (Button, Input, etc.)
    ├── hooks/        # Shared custom React hooks
    ├── utils/        # Helper functions (formatters, validators)
    ├── types/        # Global TypeScript types
    └── styles/       # Global CSS (Tailwind directives)
```

## Technology Stack

### Frontend Core
- **React 18.3+**: Component library
- **TypeScript 5+**: Static typing
- **Vite 5+**: Build tooling + dev server
- **React Router v6**: Client-side routing (placeholder, implemented in CH-023)

### State Management
- **Zustand**: Client state (auth tokens, cart, filters)
- **TanStack Query**: Server state (products, orders, API caching)

### Styling
- **Tailwind CSS 3+**: Utility-first CSS framework
- **PostCSS**: CSS processing

### HTTP Client
- **Axios**: HTTP requests to backend API
- **Base URL**: `http://localhost:8000/api/v1` (from `VITE_API_URL` env var)

### Development Tools
- **ESLint**: Code quality checker
- **Prettier**: Code formatter (2-space indent, 100 char line length)
- **TypeScript Compiler**: Type checking

## Configuration

### Environment Variables

Create `.env.local` by copying `.env.example`:

```bash
cp .env.example .env.local
```

Configure environment variables:
```
VITE_API_URL=http://localhost:8000/api/v1
VITE_MERCADOPAGO_PUBLIC_KEY=pk_test_xxxx
VITE_APP_NAME=FOOD STORE
VITE_APP_ENV=development
```

### Path Aliases

Import files using clean path aliases (configured in `vite.config.ts` and `tsconfig.json`):

```typescript
// ✅ Good
import { Button } from '@/shared/components';
import { useAuth } from '@/features/auth/hooks';
import type { Product } from '@/entities';

// ❌ Avoid
import { Button } from '../../../../../shared/components';
```

### TypeScript Strict Mode

Strict mode is **enabled by default**. This ensures:
- No implicit `any` types
- Null/undefined safety
- Full type coverage

All code MUST pass `npm run type-check` without errors.

## API Client

The Axios client is preconfigured in `src/shared/api/axiosClient.ts` with:
- Base URL from `VITE_API_URL` environment variable
- Interceptor stubs for JWT token attachment (implemented in CH-004)
- Timeout: 10 seconds

Use TanStack Query hooks for API calls:

```typescript
import { useQuery } from '@tanstack/react-query';
import { API, axiosClient } from '@/shared/api';

function ProductList() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => axiosClient.get(API.PRODUCTS.LIST),
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{/* Render products */}</div>;
}
```

## State Management Pattern

### Client State (Zustand)
Manage local state (auth tokens, cart, UI filters):

```typescript
import { useAuthStore } from '@/features/auth';

export function LoginForm() {
  const { setToken } = useAuthStore();
  // ...
}
```

### Server State (TanStack Query)
Fetch and cache server data:

```typescript
import { useQuery } from '@tanstack/react-query';

const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: () => axiosClient.get(API.PRODUCTS.LIST),
});
```

**Key Rule**: Never duplicate server data in Zustand. Use TanStack Query for API data.

## Code Quality

### Linting
```bash
npm run lint          # Check for errors
npm run lint -- --fix # Auto-fix errors
```

Rules enforce:
- No unused variables
- No implicit `any`
- React hooks best practices
- Accessibility guidelines (a11y)
- No circular dependencies

### Formatting
```bash
npm run format        # Format all files
npm run format:check  # Verify formatting
```

Configuration: 2-space indentation, 100 character line length, trailing commas.

### Type Checking
```bash
npm run type-check    # Check TypeScript without compilation
```

All code MUST be type-safe. The `strict` mode flag is non-negotiable.

## Build Optimization

Production builds are optimized with:
- Tree-shaking (unused code removal)
- Minification (esbuild)
- Source maps (for debugging)
- Asset hashing (cache-busting)

Output: `frontend/dist/` (~54 KB gzipped)

## Troubleshooting

### Port Already in Use
If port 5173 (dev) or 4173 (preview) is already in use:
```bash
npm run dev -- --port 5174
npm run preview -- --port 4174
```

### API Proxy Issues
Ensure FastAPI backend is running on `http://localhost:8000`. Check `vite.config.ts` proxy configuration if requests fail.

### TypeScript Errors
Run `npm run type-check` to identify all type errors. Fix them before committing.

### Build Failures
1. Clear `node_modules` and `dist/`: `rm -rf node_modules dist/`
2. Reinstall: `npm install`
3. Rebuild: `npm run build`

## Contributing

- Follow the FSD structure for new features
- Always run `npm run type-check && npm run lint && npm run format` before committing
- Use conventional commits: `feat(module): description`
- Keep components small and focused
- Document non-obvious logic with comments

## Performance

- **HMR**: <500ms on file change
- **Build time**: ~1-2 seconds
- **Bundle size**: ~54 KB gzipped (ES2020 target)

## License

Proprietary - FOOD STORE Internal Use Only

---

**Last Updated**: May 11, 2026  
**Frontend Version**: 0.1.0
