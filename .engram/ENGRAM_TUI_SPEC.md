# Engram TUI — Terminal User Interface for Engram Memory

**Status**: 🟡 Proposed | **Priority**: Medium | **Owner**: Team  
**Created**: 2026-05-21 | **Version**: 1.0

---

## 📋 Overview

**Engram TUI** is a terminal-based user interface to browse, search, filter, and manage Engram memory observations without using command-line flags.

### Problem

Currently, interacting with Engram requires remembering exact commands:
```bash
engram_mem_search(query="...", project="food-store-sdd", limit=10)
engram_mem_context(project="food-store-sdd", limit=20)
engram_mem_get_observation(id=123)
```

**Pain points**:
- 🔴 Complex syntax to remember
- 🔴 No visual feedback (just text)
- 🔴 Hard to browse vs search
- 🔴 Difficult to filter by multiple criteria
- 🔴 No quick way to see stats

### Solution

**Engram TUI** — Interactive terminal UI with:
- 📊 Visual browsing (projects, observations, types)
- 🔍 Integrated search + filters
- 📈 Statistics dashboard
- 📤 Export to JSON/CSV/Markdown
- ⌨️ Keyboard navigation (arrows + Enter)
- 🎨 Color-coded by type (bugfix=red, decision=blue, etc)

---

## 🎯 Features

### 1. Main Menu
```
┌──────────────────────────────────────────────┐
│  ENGRAM MEMORY BROWSER v1.0                  │
├──────────────────────────────────────────────┤
│                                              │
│  [1] 📁 Browse Projects                     │
│  [2] 🔍 Search Observations                 │
│  [3] 📋 View Recent                         │
│  [4] 🏷️  Filter by Type                     │
│  [5] 📊 Statistics & Analytics              │
│  [6] 📤 Export Data                         │
│  [7] ⚙️  Settings                           │
│  [q] 🚪 Quit                                │
│                                              │
└──────────────────────────────────────────────┘

Choose an option (1-7, q to quit):
```

### 2. Browse Projects
```
┌──────────────────────────────────────────────┐
│  Projects in Engram                          │
├──────────────────────────────────────────────┤
│                                              │
│  ▶ food-store-sdd ............... 1134 obs  │
│    FOOD-STORE-SDD ................ 0 obs    │
│    fastapi-backend ............... 45 obs   │
│    pokédex-react-ts .............. 89 obs   │
│    gentleman-ai .................. 23 obs   │
│                                              │
│  Total: 5 projects, 1291 observations       │
│                                              │
│  Navigation: ↑↓ Select | Enter View | q Back
└──────────────────────────────────────────────┘
```

### 3. Project View
```
┌──────────────────────────────────────────────┐
│  food-store-sdd — 1134 Observations         │
├──────────────────────────────────────────────┤
│                                              │
│  📊 Stats                                    │
│    Sessions: 250 | Last activity: 5 min ago │
│    Scope: 890 project + 244 personal        │
│                                              │
│  🏷️  By Type (Top 5)                        │
│    • architecture .......... 156 (14%)       │
│    • bugfix ................. 45 (4%)        │
│    • decision ............... 78 (7%)        │
│    • discovery .............. 89 (8%)        │
│    • pattern ................ 56 (5%)        │
│                                              │
│  📝 Recent Observations                      │
│    1. CH-026 Layout Separation [5m] arch    │
│    2. Ecommerce Transform Plan [1h] decision│
│    3. Fixed CORS 307 [1d] bugfix            │
│    4. JWT middleware [3d] arch              │
│    5. Zustand state pattern [1w] pattern    │
│                                              │
│  Actions: [V]iew Recent | [S]earch          │
│           [F]ilter | [E]xport | [B]ack      │
└──────────────────────────────────────────────┘
```

### 4. Search Interface
```
┌──────────────────────────────────────────────┐
│  Search Engram in: food-store-sdd            │
├──────────────────────────────────────────────┤
│                                              │
│  Query: [_________________________]          │
│                                              │
│  Filters (use arrow keys to navigate):       │
│    Type: [☑] architecture [☑] decision      │
│           [☑] bugfix      [☐] discovery     │
│           [☐] pattern     [☐] config        │
│                                              │
│    Scope: [☑] project  [☐] personal         │
│                                              │
│    Time: [☑] all  [☐] 1 day  [☐] 1 week    │
│           [☐] 1 month                       │
│                                              │
│  [SEARCH]  [CLEAR FILTERS]  [BACK]          │
│                                              │
│ Example queries:                             │
│   • "CH-026"                                 │
│   • "layout separation"                      │
│   • "fixed CORS"                             │
│   • "database migration"                     │
│                                              │
└──────────────────────────────────────────────┘
```

### 5. Search Results
```
┌──────────────────────────────────────────────┐
│  Search Results (7 matches) for: "CH-026"   │
├──────────────────────────────────────────────┤
│                                              │
│  ▶ 1. CH-026 Layout Separation        [arch]│
│      Ecommerce transformation layout split   │
│      2026-05-21 09:42 | 5 min ago           │
│                                              │
│    2. Ecommerce Transform Plan         [dec]│
│      7 changes planned (CH-026 to CH-032)   │
│      2026-05-21 09:30 | 23 min ago          │
│                                              │
│    3. Layout fixes in Router           [bug]│
│      Fixed route conflicts on layout swap   │
│      2026-05-20 14:15 | 1 day ago           │
│                                              │
│  [V]iew Selected | [N]ext Page | [B]ack     │
│                                              │
└──────────────────────────────────────────────┘
```

### 6. View Observation
```
┌──────────────────────────────────────────────┐
│  Observation #532 (food-store-sdd)          │
├──────────────────────────────────────────────┤
│                                              │
│  Title: CH-026 Layout Separation            │
│  Type: [architecture]                        │
│  Scope: project                              │
│  Created: 2026-05-21 09:42:15               │
│  Modified: 2026-05-21 09:42:15              │
│  Topic Key: sdd/ecommerce-transformation    │
│                                              │
│  ─────────────────────────────────────────  │
│                                              │
│  **What**: Separate layouts for customer    │
│  and admin users to fix shared sidebar UX.  │
│                                              │
│  **Why**: Currently all users see same      │
│  AppLayout with admin sidebar, breaking    │
│  customer ecommerce experience.             │
│                                              │
│  **Where**:                                  │
│    • frontend/src/widgets/Layout/*          │
│    • frontend/src/app/Router.tsx            │
│    • frontend/src/app/providers.tsx         │
│                                              │
│  **Learned**: Layout-based routing is       │
│  cleaner than role-scattered conditionals.  │
│  Can scale to multiple layout types easily. │
│                                              │
│  ─────────────────────────────────────────  │
│                                              │
│  [E]dit  [D]elete  [C]opy  [E]xport  [B]ack │
│                                              │
└──────────────────────────────────────────────┘
```

### 7. Statistics Dashboard
```
┌──────────────────────────────────────────────┐
│  ENGRAM STATISTICS — food-store-sdd         │
├──────────────────────────────────────────────┤
│                                              │
│  📊 Overview                                 │
│     Total Observations: 1134                │
│     Sessions: 250                           │
│     Last Activity: 5 min ago                │
│                                              │
│  📈 By Type                                  │
│     Architecture    ████████████░░ 156 (14%)│
│     Other           ███████████░░░ 766 (68%)│
│     Bugfix          ██░░░░░░░░░░░░ 45 (4%) │
│     Discovery       ███░░░░░░░░░░░ 89 (8%) │
│     Decision        ██░░░░░░░░░░░░ 78 (7%) │
│                                              │
│  📂 By Scope                                 │
│     Project ████████████████░░░ 890 (78%)  │
│     Personal ███░░░░░░░░░░░░░░░ 244 (22%)  │
│                                              │
│  ⏰ By Time Range                            │
│     Last 7 days    ████░░░░░░░░░░░ 234     │
│     Last 30 days   ██████░░░░░░░░░ 456     │
│     Last 90 days   ██████████░░░░░ 678     │
│     All time       ███████████░░░░ 1134    │
│                                              │
│  🏆 Top Topics (by count)                   │
│     1. sdd/ecommerce-transformation .... 12 │
│     2. architecture/auth-model ......... 8  │
│     3. bugfix/database ................ 15 │
│     4. decision/tech-stack ............ 6  │
│     5. pattern/state-management ....... 9  │
│                                              │
│  📅 Activity Timeline (last 7 days)         │
│     Mon: ███ (45)   Tue: ██ (32)            │
│     Wed: ███░ (48)  Thu: ████ (67) ← TODAY │
│     Fri: ░░░ (0)    Sat: ░░░ (0)            │
│     Sun: ░░░ (0)                            │
│                                              │
│  [R]efresh  [C]ompareTo  [E]xport  [B]ack  │
│                                              │
└──────────────────────────────────────────────┘
```

### 8. Export Dialog
```
┌──────────────────────────────────────────────┐
│  Export Observations                         │
├──────────────────────────────────────────────┤
│                                              │
│  Format:                                     │
│    ▶ JSON (.json)                           │
│      CSV (.csv)                             │
│      Markdown (.md)                         │
│      XML (.xml)                             │
│                                              │
│  Range:                                      │
│    ▶ Selected (7 items)                     │
│      Current Filter (234 items)             │
│      Entire Project (1134 items)            │
│                                              │
│  Include Metadata:                           │
│    ☑ Timestamps                             │
│    ☑ Type & Scope                           │
│    ☑ Topic Keys                             │
│    ☑ Full Content                           │
│                                              │
│  Output:                                     │
│    📁 ~/Downloads/engram-export-2026-05-21  │
│                                              │
│  [EXPORT]  [CHANGE FOLDER]  [CANCEL]        │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 🛠️ Technical Specification

### Technology Stack

```json
{
  "runtime": "Node.js 18+",
  "language": "TypeScript",
  "framework": "Ink (React for terminal)",
  "ui_components": [
    "ink-select-input (dropdowns)",
    "ink-text-input (text input)",
    "ink-table (tables)",
    "chalk (colors)",
    "cli-spinners (loading)"
  ],
  "utilities": [
    "commander (CLI parsing)",
    "axios (HTTP requests)",
    "date-fns (date formatting)"
  ],
  "build": "esbuild",
  "package_manager": "npm"
}
```

### Project Structure

```
.engram/
├── ENGRAM_TUI_SPEC.md ................. (this file)
├── engram-tui/
│   ├── src/
│   │   ├── index.ts .................. Entry point
│   │   ├── main.tsx .................. Root component
│   │   ├── components/
│   │   │   ├── MainMenu.tsx
│   │   │   ├── ProjectBrowser.tsx
│   │   │   ├── SearchInterface.tsx
│   │   │   ├── ObservationViewer.tsx
│   │   │   ├── StatsDashboard.tsx
│   │   │   ├── ExportDialog.tsx
│   │   │   └── Common/
│   │   │       ├── Navigation.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── ConfirmDialog.tsx
│   │   ├── hooks/
│   │   │   ├── useEngram.ts .......... Engram API calls
│   │   │   ├── useSearch.ts ......... Search logic
│   │   │   ├── useFilter.ts ......... Filtering
│   │   │   ├── useNavigation.ts ..... Menu navigation
│   │   │   └── useExport.ts ......... Export logic
│   │   ├── utils/
│   │   │   ├── format.ts ............ Formatting (dates, text)
│   │   │   ├── colors.ts ............ Color scheme
│   │   │   ├── tables.ts ............ Table rendering
│   │   │   ├── api.ts ............... Engram API wrapper
│   │   │   └── export.ts ............ Export handlers
│   │   ├── types/
│   │   │   ├── index.ts ............ Type definitions
│   │   │   ├── engram.ts .......... Engram types
│   │   │   ├── ui.ts .............. UI component types
│   │   │   └── api.ts ............. API response types
│   │   └── constants/
│   │       ├── colors.ts ............ Color definitions
│   │       ├── messages.ts .......... UI messages
│   │       └── keybindings.ts ....... Keyboard shortcuts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .eslintrc.json
│   └── README.md
│
├── INSTALLATION.md ..................... Setup instructions
├── USAGE.md ............................ Usage guide
├── DEVELOPMENT.md ...................... Dev guide
└── ROADMAP.md ......................... Future features
```

---

## 📦 Installation & Usage

### Install
```bash
# Clone/pull project
cd FOOD-STORE-SDD
cd .engram/engram-tui

# Install dependencies
npm install

# Build
npm run build

# Link globally (or use npx)
npm link

# Or use directly
npx engram-tui
```

### Usage
```bash
# Default (main menu)
engram-tui

# Open specific project
engram-tui --project food-store-sdd

# Quick search
engram-tui search "CH-026"

# View stats
engram-tui stats

# Export
engram-tui export --format json --project food-store-sdd

# Help
engram-tui --help
```

---

## ⌨️ Keyboard Shortcuts

```
Navigation:
  ↑ / ↓     — Move up/down
  ← / →     — Move left/right
  Enter     — Select/Confirm
  Tab       — Next field
  Shift+Tab — Previous field

Actions:
  / (slash)      — Quick search
  ? (question)   — Help/keybindings
  v              — View selected
  e              — Edit selected
  d              — Delete selected
  c              — Copy to clipboard
  x              — Export
  r              — Refresh
  Escape / q     — Back/Quit
  Ctrl+C         — Exit
```

---

## 🎨 Color Scheme

```
Type Colors:
  • Architecture: 🔵 Blue     (#0066CC)
  • Decision:    🟣 Purple   (#9933FF)
  • Bugfix:      🔴 Red      (#FF3333)
  • Discovery:   🟢 Green    (#00AA44)
  • Pattern:     🟠 Orange   (#FF8800)
  • Config:      🟡 Yellow   (#FFBB00)
  • Learning:    🟦 Cyan     (#00CCFF)

Highlights:
  • Selected:    Bold + Bright
  • Error:       Red background
  • Success:     Green checkmark
  • Loading:     Spinner animation
```

---

## 🔄 Data Flow

```
User Input
    ↓
[Navigation] (keyboard + arrow keys)
    ↓
[Menu Handler] (route to component)
    ↓
[Component State] (local UI state)
    ↓
[Engram Hook] (useEngram, useSearch, etc)
    ↓
[API Wrapper] (axios call to Engram)
    ↓
Engram Memory
    ↓
Response (observations, projects, stats)
    ↓
[Format & Display] (colors, tables, text)
    ↓
Terminal Rendering (Ink JSX)
    ↓
User sees UI
```

---

## 🚀 Roadmap

### Phase 1: MVP (v1.0)
- [x] Main menu
- [x] Browse projects
- [x] Search observations
- [x] View single observation
- [x] Statistics dashboard
- [x] Export JSON/CSV/MD

### Phase 2: Enhanced (v1.1)
- [ ] Edit observations
- [ ] Delete observations
- [ ] Copy to clipboard
- [ ] Inline preview
- [ ] Favorites/bookmarks
- [ ] Theme customization

### Phase 3: Advanced (v2.0)
- [ ] Sync across team
- [ ] Collaborative editing
- [ ] Comments/discussions
- [ ] AI-powered tagging
- [ ] Full-text search with ranking
- [ ] Integration with Git commits

---

## 📝 Notes for Teammates

### For Developers
- Install Node.js 18+
- Follow INSTALLATION.md for setup
- See DEVELOPMENT.md for dev workflow
- Tests in `engram-tui/__tests__/`

### For Users
- Read USAGE.md for getting started
- Use `engram-tui --help` for commands
- Press `?` in app for keybindings
- Export to share data with team

### For Contributors
- PRs welcome! Follow DEVELOPMENT.md
- Keep components small and focused
- Add tests for new features
- Update docs when making changes

---

## 🔗 Related Files

- `INSTALLATION.md` — Step-by-step setup
- `USAGE.md` — User guide with examples
- `DEVELOPMENT.md` — Dev setup + architecture
- `ROADMAP.md` — Future features + timeline

---

**Status**: 🟡 Specification Ready  
**Next Step**: Create INSTALLATION.md, implement MVP components  
**Created**: 2026-05-21  
**Version**: 1.0
