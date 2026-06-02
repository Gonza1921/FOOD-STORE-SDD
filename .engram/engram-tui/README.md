# engram-tui — Project README

**Status**: 🟡 Scaffolding Complete | Components Pending  
**Version**: 1.0.0-alpha  
**Created**: 2026-05-21

---

## 📁 Project Structure

```
engram-tui/
├── src/
│   ├── App.tsx                    # Main app component (placeholder)
│   ├── index.ts                   # Entry point
│   │
│   ├── components/
│   │   ├── .gitkeep              # (Components TBD)
│   │   └── [Components to implement]
│   │
│   ├── hooks/
│   │   ├── .gitkeep              # (Hooks TBD)
│   │   └── [Hooks to implement]
│   │
│   ├── utils/
│   │   ├── api.ts                # Engram API wrapper ✅
│   │   ├── format.ts             # Formatting utilities ✅
│   │   └── index.ts              # Utilities index ✅
│   │
│   ├── types/
│   │   ├── engram.ts             # Engram types ✅
│   │   ├── ui.ts                 # UI types ✅
│   │   ├── api.ts                # API types ✅
│   │   └── index.ts              # Types index ✅
│   │
│   ├── constants/
│   │   ├── colors.ts             # Color definitions ✅
│   │   ├── messages.ts           # UI messages ✅
│   │   ├── keybindings.ts        # Keyboard shortcuts ✅
│   │   └── index.ts              # Constants index ✅
│   │
│   └── __tests__/
│       └── basic.test.ts         # Example tests ✅
│
├── bin/
│   └── cli.js                     # CLI entry point ✅
│
├── package.json                   # Dependencies ✅
├── tsconfig.json                  # TypeScript config ✅
├── jest.config.js                 # Jest config ✅
├── .eslintrc.json                 # ESLint config ✅
├── .prettierrc.json               # Prettier config ✅
├── .gitignore                     # Git ignore ✅
├── dist/                          # (Generated on build)
└── node_modules/                  # (Generated on npm install)
```

---

## ✅ Completed

- ✅ Directory structure
- ✅ package.json (all dependencies)
- ✅ TypeScript configuration
- ✅ ESLint + Prettier config
- ✅ Jest configuration
- ✅ Type definitions (engram.ts, ui.ts, api.ts)
- ✅ Constants (colors, messages, keybindings)
- ✅ Utilities (API wrapper, formatting)
- ✅ Entry points (index.ts, cli.js)
- ✅ Example component (App.tsx)
- ✅ Example test

---

## 🚀 Quick Start

### Install

```bash
npm install
```

### Development

```bash
# Watch mode with hot reload
npm run dev

# TypeScript check
npm run type-check

# Lint check
npm run lint
npm run lint:fix

# Format check
npm run format:check
npm run format
```

### Build

```bash
npm run build
```

### Test

```bash
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

### Run

```bash
npm start
# or
node dist/bin/cli.js
```

---

## 📋 Next Steps (Components Implementation)

### Phase 1: Core Components

1. **MainMenu.tsx** — Main menu UI (7 options)
2. **ProjectBrowser.tsx** — Browse projects list
3. **SearchInterface.tsx** — Search + filters UI
4. **Common/Navigation.tsx** — Breadcrumbs

### Phase 2: Feature Components

5. **ObservationViewer.tsx** — View single observation
6. **StatsDashboard.tsx** — Statistics visualization
7. **ExportDialog.tsx** — Export wizard
8. **Common/ConfirmDialog.tsx** — Confirmation dialog

### Phase 3: Hooks

9. **hooks/useEngram.ts** — Engram API interactions
10. **hooks/useSearch.ts** — Search logic
11. **hooks/useFilter.ts** — Filter management
12. **hooks/useNavigation.ts** — Navigation state
13. **hooks/useExport.ts** — Export logic

### Phase 4: Testing & Polish

14. Add unit tests for components
15. Add integration tests
16. Performance optimization
17. Documentation updates

---

## 🔌 Dependencies Overview

### Runtime
- **ink** — React for terminal UI
- **react** — Component framework
- **axios** — HTTP client
- **chalk** — Terminal colors
- **commander** — CLI argument parsing
- **date-fns** — Date formatting

### Dev Tools
- **TypeScript** — Type safety
- **Jest** — Testing framework
- **ts-jest** — TypeScript Jest support
- **ESLint** — Code linting
- **Prettier** — Code formatting
- **tsx** — TypeScript runner

---

## 🧪 Testing Strategy

```typescript
// Component tests
describe('MainMenu', () => {
  it('should render all menu options', () => {
    // Test implementation
  });
});

// Hook tests
describe('useEngram', () => {
  it('should fetch projects', async () => {
    // Test implementation
  });
});

// Utility tests
describe('formatDate', () => {
  it('should format date correctly', () => {
    // Test implementation
  });
});
```

---

## 🎨 Component Development Guidelines

### Component Template

```typescript
import React, { FC } from 'react';
import { Box, Text } from 'ink';

interface Props {
  // Define props here
}

/**
 * Component description
 */
export const MyComponent: FC<Props> = ({ /* props */ }) => {
  return (
    <Box flexDirection="column">
      <Text>Hello</Text>
    </Box>
  );
};

export default MyComponent;
```

### Hook Template

```typescript
import { useState, useCallback } from 'react';

interface UseMyHookResult {
  // Define return type here
}

/**
 * Hook description
 */
export function useMyHook(): UseMyHookResult {
  const [state, setState] = useState(null);

  const myMethod = useCallback(() => {
    // Implementation
  }, []);

  return {
    state,
    myMethod,
  };
}
```

---

## 📝 Git Workflow

### Creating a Feature Branch

```bash
git checkout -b feature/implement-main-menu
```

### Committing

```bash
git commit -m "feat(components): implement MainMenu component

- Add menu options rendering
- Add keyboard navigation
- Add color styling"
```

### After Implementation

```bash
git push origin feature/implement-main-menu
# Create PR in GitHub
```

---

## 🚨 Common Issues

### TypeScript Errors

```bash
npm run type-check
```

### Module Resolution

If you get "Cannot find module" errors:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Ink Rendering Issues

- Ensure terminal supports colors (256-color minimum)
- Check if running in raw mode TTY
- Use `chalk` for color fallbacks

---

## 📚 Resources

- **Ink Docs**: https://github.com/vadimdemedes/ink
- **React Hooks**: https://react.dev/reference/react/hooks
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Jest**: https://jestjs.io/docs/getting-started

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/xyz`
2. Implement with tests
3. Run linter: `npm run lint:fix`
4. Run tests: `npm test`
5. Push and create PR

---

## 📞 Questions?

- Check [../DEVELOPMENT.md](../DEVELOPMENT.md) for detailed dev guide
- Check [../USAGE.md](../USAGE.md) for usage guide
- Check [../ENGRAM_TUI_SPEC.md](../ENGRAM_TUI_SPEC.md) for technical specs

---

**Ready to implement! 🚀**
