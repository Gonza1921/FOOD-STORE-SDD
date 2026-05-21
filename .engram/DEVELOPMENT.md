# Engram TUI — Development Guide

**Last Updated**: 2026-05-21  
**For**: Contributors and maintainers

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- TypeScript knowledge
- Familiarity with React/Hooks
- Terminal/CLI experience

### Initial Setup

```bash
# Clone repo (already done)
cd FOOD-STORE-SDD/.engram/engram-tui

# Install dependencies
npm install

# Start development server with watch
npm run dev

# In another terminal, run tests
npm run test:watch
```

---

## 📁 Project Structure

```
engram-tui/
├── src/
│   ├── index.ts ..................... Entry point (CLI)
│   ├── main.tsx ..................... Root React component
│   │
│   ├── components/
│   │   ├── MainMenu.tsx ............ Main menu UI
│   │   ├── ProjectBrowser.tsx ....... Browse projects
│   │   ├── SearchInterface.tsx ...... Search + filters
│   │   ├── ObservationViewer.tsx .... View single observation
│   │   ├── StatsDashboard.tsx ....... Analytics dashboard
│   │   ├── ExportDialog.tsx ......... Export dialog
│   │   │
│   │   └── Common/
│   │       ├── Navigation.tsx ....... Breadcrumbs + nav
│   │       ├── LoadingSpinner.tsx ... Loading state
│   │       ├── ConfirmDialog.tsx .... Confirm actions
│   │       ├── TextInput.tsx ........ Text input wrapper
│   │       └── TableView.tsx ........ Table rendering
│   │
│   ├── hooks/
│   │   ├── useEngram.ts ............ Engram API calls
│   │   ├── useSearch.ts ........... Search logic + state
│   │   ├── useFilter.ts ........... Filter state management
│   │   ├── useNavigation.ts ........ Menu navigation state
│   │   └── useExport.ts ........... Export logic
│   │
│   ├── utils/
│   │   ├── format.ts .............. Formatting (dates, text)
│   │   ├── colors.ts .............. Color scheme + styling
│   │   ├── tables.ts .............. Table rendering utils
│   │   ├── api.ts ................. Engram API wrapper
│   │   ├── export.ts .............. Export handlers
│   │   └── validators.ts .......... Input validation
│   │
│   ├── types/
│   │   ├── index.ts .............. Type definitions
│   │   ├── engram.ts ............. Engram types
│   │   ├── ui.ts ................. UI types
│   │   └── api.ts ................ API response types
│   │
│   ├── constants/
│   │   ├── colors.ts ............ Color hex codes
│   │   ├── messages.ts .......... UI messages
│   │   └── keybindings.ts ....... Keyboard shortcut defs
│   │
│   └── __tests__/
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       └── integration/
│
├── bin/
│   └── cli.js ..................... CLI entry point
│
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.json
└── README.md
```

---

## 🏗️ Architecture

### Component Hierarchy

```
<Root>
  ├─ <MainMenu>
  │   ├─ [1] <ProjectBrowser>
  │   │   └─ <ObservationViewer>
  │   ├─ [2] <SearchInterface>
  │   │   └─ <ResultsList>
  │   ├─ [3] <RecentObservations>
  │   ├─ [4] <FilterByType>
  │   ├─ [5] <StatsDashboard>
  │   ├─ [6] <ExportDialog>
  │   └─ [7] <Settings>
  │
  └─ <Navigation> (global breadcrumbs)
```

### State Management

**Global State** (using React hooks at root):
- `currentMenu` — Active menu item
- `selectedProject` — Current project context
- `observations` — Loaded observations list
- `filters` — Active filters (type, scope, time)
- `searchQuery` — Current search text

**Local State** (component-level):
- `loading` — Loading states
- `error` — Error messages
- `selectedObservation` — Currently viewed observation

---

## 🔌 Hooks

### useEngram

Handles all Engram API interactions.

```typescript
const {
  projects,        // List of all projects
  observations,    // Current observations
  stats,          // Statistics data
  loading,        // Loading state
  error,          // Error message if any
  
  // Methods
  fetchProjects,
  fetchObservations,
  fetchStats,
  getObservation,
  searchObservations,
  deleteObservation,
  updateObservation,
} = useEngram();
```

### useSearch

Manages search state and filtering.

```typescript
const {
  query,           // Current search text
  results,         // Search results
  isSearching,     // Loading state
  
  // Methods
  search,
  clearSearch,
  updateQuery,
} = useSearch();
```

### useFilter

Manages active filters.

```typescript
const {
  filters,         // Current filters: { types, scopes, timeRanges }
  filteredData,    // Data after applying filters
  
  // Methods
  toggleType,
  toggleScope,
  setTimeRange,
  clearFilters,
  applyFilters,
} = useFilter();
```

### useNavigation

Handles menu navigation state.

```typescript
const {
  currentMenu,     // Current active menu item
  breadcrumbs,     // Navigation breadcrumb trail
  
  // Methods
  goToMenu,
  goBack,
  goHome,
  resetNavigation,
} = useNavigation();
```

### useExport

Handles data export logic.

```typescript
const {
  isExporting,     // Export in progress
  exportProgress,  // Progress percentage
  
  // Methods
  exportJSON,
  exportCSV,
  exportMarkdown,
  exportXML,
  cancelExport,
} = useExport();
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode (during development)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

```typescript
// __tests__/components/MainMenu.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainMenu from '../../components/MainMenu';

describe('MainMenu', () => {
  it('should render all menu options', () => {
    render(<MainMenu />);
    expect(screen.getByText(/Browse Projects/i)).toBeInTheDocument();
    expect(screen.getByText(/Search Observations/i)).toBeInTheDocument();
  });

  it('should navigate to project browser on option 1', async () => {
    render(<MainMenu />);
    await userEvent.keyboard('1');
    expect(screen.getByText(/Projects in Engram/i)).toBeInTheDocument();
  });
});
```

### Mock Engram API

```typescript
// __tests__/utils/api.mock.ts
export const mockEngram = {
  listProjects: jest.fn().mockResolvedValue([
    { name: 'food-store-sdd', obs_count: 1134 },
  ]),
  searchObservations: jest.fn().mockResolvedValue([
    { id: 1, title: 'Test', type: 'bugfix' },
  ]),
};
```

---

## 🎨 Styling

### Color Scheme

Colors are centralized in `src/constants/colors.ts`:

```typescript
export const colors = {
  // Type colors
  types: {
    architecture: '#0066CC',  // Blue
    decision: '#9933FF',      // Purple
    bugfix: '#FF3333',        // Red
    discovery: '#00AA44',     // Green
    pattern: '#FF8800',       // Orange
    config: '#FFBB00',        // Yellow
    learning: '#00CCFF',      // Cyan
  },
  
  // UI colors
  ui: {
    selected: '#FFFFFF',
    disabled: '#666666',
    error: '#FF3333',
    success: '#00AA44',
    warning: '#FF8800',
  },
  
  // Using chalk
  bold: (text) => chalk.bold(text),
  blue: (text) => chalk.hex('#0066CC')(text),
};
```

### Using Colors in Components

```typescript
import { Text, Box } from 'ink';
import { colors } from '../constants/colors';

export const TypeBadge = ({ type }: { type: string }) => (
  <Text color={colors.types[type]}>
    {type}
  </Text>
);
```

---

## 📡 API Integration

### Engram API Wrapper

Located in `src/utils/api.ts`:

```typescript
export class EngramAPI {
  constructor(private apiUrl: string, private apiKey: string) {}
  
  async listProjects(): Promise<Project[]> {
    const response = await axios.get(`${this.apiUrl}/projects`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.data;
  }
  
  async searchObservations(
    query: string,
    filters?: SearchFilters
  ): Promise<Observation[]> {
    const response = await axios.post(
      `${this.apiUrl}/search`,
      { query, filters },
      { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
    );
    return response.data;
  }
}
```

### Configuration

Reads from `~/.config/opencode/engram.json`:

```typescript
// src/utils/config.ts
export const loadConfig = () => {
  const configPath = path.join(os.homedir(), '.config/opencode/engram.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return {
    apiUrl: config.api_url || 'http://localhost:8000',
    apiKey: config.api_key,
    defaultProject: config.default_project || 'food-store-sdd',
  };
};
```

---

## 🚀 Building & Packaging

### Development Build

```bash
npm run dev
```

Starts TypeScript compiler in watch mode.

### Production Build

```bash
npm run build
```

Outputs to `dist/` folder.

### Link Globally

```bash
npm link
```

Makes `engram-tui` command available globally.

### Package for Distribution

```bash
npm pack
```

Creates `.tgz` file for distribution.

---

## 🐛 Debugging

### Enable Debug Logging

```bash
DEBUG=engram-tui:* npm start
```

### Debug Specific Module

```bash
DEBUG=engram-tui:api npm start
DEBUG=engram-tui:search npm start
```

### VS Code Debug Config

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Engram TUI",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeArgs": ["--loader", "ts-node/esm"],
      "console": "integratedTerminal"
    }
  ]
}
```

Then press F5 to debug.

---

## 📝 Code Style

### TypeScript

```typescript
// ✅ Good
interface Observation {
  id: number;
  title: string;
  type: ObservationType;
  createdAt: Date;
}

const getObservation = async (id: number): Promise<Observation> => {
  const response = await api.get(`/observations/${id}`);
  return response.data;
};

// ❌ Bad
const getObservation = async (id) => {
  return api.get(`/observations/${id}`);
};
```

### Component Structure

```typescript
// ✅ Good
interface Props {
  observations: Observation[];
  onSelect: (obs: Observation) => void;
}

export const ObservationList: React.FC<Props> = ({
  observations,
  onSelect,
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  
  return (
    <Box flexDirection="column">
      {observations.map((obs) => (
        <Box key={obs.id} onClick={() => onSelect(obs)}>
          <Text>{obs.title}</Text>
        </Box>
      ))}
    </Box>
  );
};

// ❌ Bad
export const ObservationList = (props) => {
  return <div>{/* ... */}</div>;
};
```

### File Naming

```
✅ Good:
- components/ObservationViewer.tsx
- hooks/useEngram.ts
- utils/format.ts
- types/engram.ts

❌ Bad:
- components/observation-viewer.tsx
- hooks/useengram.ts
- utils/format-utils.ts
- types/types.ts
```

---

## 🔄 Git Workflow

### Branch Naming

```bash
# Feature
git checkout -b feature/export-markdown

# Bugfix
git checkout -b fix/search-filter-bug

# Improvement
git checkout -b improve/performance-stats
```

### Commits

```bash
# Feature
git commit -m "feat(export): add markdown export format"

# Bugfix
git commit -m "fix(search): filter by type now works correctly"

# Tests
git commit -m "test(api): add unit tests for search function"

# Docs
git commit -m "docs(readme): update installation instructions"
```

### Pull Requests

1. Create feature branch
2. Make changes + commit
3. Push to origin
4. Create PR with description
5. Wait for review
6. Merge when approved

---

## 📚 Adding New Features

### Example: Add "Favorites" Feature

#### 1. Create Type

```typescript
// src/types/engram.ts
export interface Observation {
  // ... existing fields
  isFavorited?: boolean;
}
```

#### 2. Create Hook

```typescript
// src/hooks/useFavorites.ts
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<number[]>([]);
  
  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id)
        ? prev.filter(fId => fId !== id)
        : [...prev, id]
    );
  };
  
  return { favorites, toggleFavorite, isFavorited: (id) => favorites.includes(id) };
};
```

#### 3. Add UI Component

```typescript
// src/components/FavoriteButton.tsx
interface Props {
  id: number;
  isFavorited: boolean;
  onToggle: (id: number) => void;
}

export const FavoriteButton: React.FC<Props> = ({
  id,
  isFavorited,
  onToggle,
}) => (
  <Text
    onClick={() => onToggle(id)}
    color={isFavorited ? 'yellow' : 'gray'}
  >
    {isFavorited ? '⭐' : '☆'}
  </Text>
);
```

#### 4. Integrate into Menu

```typescript
// src/components/MainMenu.tsx
<Box marginRight={2}>
  <FavoriteButton
    id={observation.id}
    isFavorited={favorites.includes(observation.id)}
    onToggle={toggleFavorite}
  />
</Box>
```

#### 5. Add Tests

```typescript
// src/__tests__/hooks/useFavorites.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useFavorites } from '../../hooks/useFavorites';

describe('useFavorites', () => {
  it('should toggle favorite status', () => {
    const { result } = renderHook(() => useFavorites());
    
    act(() => result.current.toggleFavorite(1));
    expect(result.current.isFavorited(1)).toBe(true);
    
    act(() => result.current.toggleFavorite(1));
    expect(result.current.isFavorited(1)).toBe(false);
  });
});
```

---

## 🤝 Contributing

### Before Starting

1. Check `ROADMAP.md` for planned features
2. Open issue if not listed
3. Wait for approval (if substantial)
4. Assign to yourself

### During Development

1. Keep commits small and focused
2. Add tests for new features
3. Update documentation
4. Run linter: `npm run lint`
5. Run tests: `npm run test`

### Before PR

1. Test locally: `npm run dev`
2. Run full test suite: `npm test`
3. Check code style: `npm run lint --fix`
4. Update CHANGELOG if applicable
5. Write clear PR description

---

## 📊 Performance Considerations

### Lazy Loading

```typescript
// Load observations in batches, not all at once
const [page, setPage] = useState(0);
const pageSize = 50;

const loadMore = async () => {
  const next = await fetchObservations({
    limit: pageSize,
    offset: page * pageSize,
  });
  setObservations(prev => [...prev, ...next]);
  setPage(prev => prev + 1);
};
```

### Memoization

```typescript
// Memoize expensive computations
const filteredObservations = useMemo(
  () => observations.filter(obs => matchesFilters(obs, filters)),
  [observations, filters]
);
```

### Debouncing Search

```typescript
// Debounce search to avoid too many API calls
const debouncedSearch = debounce(async (query: string) => {
  const results = await api.search(query);
  setResults(results);
}, 300);
```

---

## 🚨 Troubleshooting Development

### Port conflicts

```bash
# Use different port
PORT=3001 npm run dev
```

### Module not found

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
npm run type-check
```

### Test failures

```bash
npm run test -- --verbose
```

---

## 📖 Additional Resources

- **Ink documentation**: https://github.com/vadimdemedes/ink
- **React Hooks**: https://react.dev/reference/react/hooks
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Jest Testing**: https://jestjs.io/docs/getting-started

---

**Happy coding! 🚀**
