# Engram TUI — Usage Guide

**Last Updated**: 2026-05-21  
**For**: food-store-sdd team members

---

## 🎯 Quick Start

### Launch the App

```bash
cd .engram/engram-tui
npm start

# Or if globally linked:
engram-tui
```

### Main Menu

```
┌──────────────────────────────────────────┐
│  ENGRAM MEMORY BROWSER v1.0              │
├──────────────────────────────────────────┤
│  [1] 📁 Browse Projects                 │
│  [2] 🔍 Search Observations             │
│  [3] 📋 View Recent                     │
│  [4] 🏷️  Filter by Type                 │
│  [5] 📊 Statistics & Analytics          │
│  [6] 📤 Export Data                     │
│  [7] ⚙️  Settings                       │
│  [q] 🚪 Quit                            │
└──────────────────────────────────────────┘
```

Use arrow keys (↑↓) to navigate, Enter to select, `q` to quit.

---

## 📁 Feature 1: Browse Projects

**Menu Option**: `[1] 📁 Browse Projects`

### What It Does
Lists all projects in your Engram memory and lets you explore observations by project.

### How to Use

1. Select `[1]` from main menu
2. Use ↑↓ arrows to highlight a project
3. Press Enter to view that project
4. See project stats and recent observations
5. Select an observation to view details

### Example

```
┌──────────────────────────────────────────┐
│  Projects in Engram                      │
├──────────────────────────────────────────┤
│  ▶ food-store-sdd ........... 1134 obs  │
│    fastapi-backend ............ 45 obs  │
│    pokédex-react-ts ........... 89 obs  │
│    gentleman-ai ............... 23 obs  │
└──────────────────────────────────────────┘

↑↓ Navigate | Enter Select | B Back | Q Quit
```

Select `food-store-sdd` to see:
- Total observations (1134)
- Sessions (250)
- Last activity (5 min ago)
- Top types (architecture, bugfix, etc)
- Recent observations (clickable)

---

## 🔍 Feature 2: Search Observations

**Menu Option**: `[2] 🔍 Search Observations`

### What It Does
Full-text search across all observations in your selected project.

### How to Use

1. Select `[2]` from main menu
2. Type your search query (e.g., "CH-026", "auth", "CORS")
3. (Optional) Apply filters:
   - **Type**: architecture, bugfix, decision, discovery, pattern, config
   - **Scope**: project or personal
   - **Time**: all, 1 day, 1 week, 1 month
4. Press Enter or click [SEARCH]
5. Browse results (↑↓ navigate)
6. Press Enter to view selected result

### Example Searches

```bash
# Search by change number
engram-tui search "CH-026"

# Search by topic
engram-tui search "layout separation"

# Search by bug
engram-tui search "CORS 307"

# Search by pattern
engram-tui search "auth middleware"
```

### Within App

```
┌──────────────────────────────────────────┐
│  Search Engram — food-store-sdd          │
├──────────────────────────────────────────┤
│  Query: [_________________________]       │
│                                          │
│  Filters:                                │
│    Type: [☑] architecture [☑] bugfix    │
│    Scope: [☑] project [☐] personal     │
│    Time: [☑] all                        │
│                                          │
│  [SEARCH]  [CLEAR]  [BACK]               │
└──────────────────────────────────────────┘
```

### Results

```
7 matches for "CH-026":

1. CH-026 Layout Separation [arch]
   Ecommerce transformation layout split
   2026-05-21 09:42 | 5 min ago

2. Ecommerce Transform Plan [decision]
   7 changes planned (CH-026 to CH-032)
   2026-05-21 09:30 | 23 min ago

3. Layout fixes in Router [bugfix]
   Fixed route conflicts
   2026-05-20 14:15 | 1 day ago
```

---

## 📋 Feature 3: View Recent

**Menu Option**: `[3] 📋 View Recent`

### What It Does
Shows most recently created/modified observations across all projects.

### How to Use

1. Select `[3]` from main menu
2. Browse recent observations (most recent first)
3. Click to view details
4. Filter by:
   - Project
   - Type
   - Time range (today, this week, this month, all time)

### Example Output

```
┌──────────────────────────────────────────┐
│  Recent Observations (Last 7 Days)       │
├──────────────────────────────────────────┤
│  1. CH-026 Layout Separation [arch]      │
│     food-store-sdd | 5 min ago           │
│                                          │
│  2. Ecommerce Transform Plan [decision]  │
│     food-store-sdd | 23 min ago          │
│                                          │
│  3. Fixed CORS 307 [bugfix]              │
│     food-store-sdd | 1 day ago           │
│                                          │
│  4. JWT middleware [architecture]        │
│     food-store-sdd | 3 days ago          │
│                                          │
│  5. Zustand state pattern [pattern]      │
│     food-store-sdd | 1 week ago          │
└──────────────────────────────────────────┘
```

---

## 🏷️ Feature 4: Filter by Type

**Menu Option**: `[4] 🏷️  Filter by Type`

### What It Does
View all observations grouped and filtered by type.

### Types Available

| Type | Color | Use For |
|------|-------|---------|
| 🔵 architecture | Blue | Design decisions, system structure |
| 🟣 decision | Purple | Tech choices, tradeoffs |
| 🔴 bugfix | Red | Bug fixes, root cause analysis |
| 🟢 discovery | Green | Learnings, non-obvious findings |
| 🟠 pattern | Orange | Reusable patterns, conventions |
| 🟡 config | Yellow | Configuration, environment setup |
| 🟦 learning | Cyan | Educational notes, how-tos |

### How to Use

1. Select `[4]` from main menu
2. Choose type from list
3. See all observations of that type
4. Sort by:
   - Date (newest first)
   - Date (oldest first)
   - Title (A-Z)
5. Click to view details

### Example

```
┌──────────────────────────────────────────┐
│  Filter by Type                          │
├──────────────────────────────────────────┤
│  [☑] Architecture    (156 observations)  │
│  [☑] Bugfix          (45 observations)   │
│  [☐] Decision        (78 observations)   │
│  [☐] Discovery       (89 observations)   │
│  [☐] Pattern         (56 observations)   │
│  [☐] Config          (12 observations)   │
│  [☐] Learning        (23 observations)   │
│                                          │
│  Showing: 156 architecture observations  │
│  [V]iew  [S]ort  [B]ack                  │
└──────────────────────────────────────────┘
```

---

## 📊 Feature 5: Statistics & Analytics

**Menu Option**: `[5] 📊 Statistics & Analytics`

### What It Does
Detailed analytics about your Engram memory usage.

### Metrics Shown

**Overview**
- Total observations
- Active sessions
- Last activity timestamp
- Most used project

**By Type**
- Count per type
- Percentage distribution
- Bar chart visualization

**By Scope**
- Project observations
- Personal observations
- Percentage split

**By Time**
- Last 7 days
- Last 30 days
- Last 90 days
- All time
- Activity timeline (daily breakdown)

**Top Topics**
- Most frequently tagged topics
- Ranked by count
- Click to view all in topic

### How to Use

1. Select `[5]` from main menu
2. Browse statistics
3. Press `U` to update/refresh
4. Press `C` to compare to previous period
5. Press `E` to export statistics
6. Press `B` to go back

### Example Output

```
┌──────────────────────────────────────────┐
│  ENGRAM STATISTICS — food-store-sdd      │
├──────────────────────────────────────────┤
│  📊 Overview                             │
│     Total: 1134 | Sessions: 250          │
│     Last activity: 5 min ago             │
│                                          │
│  📈 By Type                              │
│     Architecture ███████ 156 (14%)       │
│     Other       ███████████ 766 (68%)    │
│     Bugfix      ██ 45 (4%)               │
│     Discovery   ███ 89 (8%)              │
│     Decision    ██ 78 (7%)               │
│                                          │
│  📂 By Scope                             │
│     Project ████████████████ 890 (78%)   │
│     Personal ███ 244 (22%)               │
│                                          │
│  🏆 Top Topics                           │
│     1. sdd/ecommerce-transformation (12) │
│     2. architecture/auth-model (8)       │
│     3. bugfix/database (15)              │
│                                          │
│  [R]efresh  [C]ompareTo  [E]xport [B]ack│
└──────────────────────────────────────────┘
```

---

## 📤 Feature 6: Export Data

**Menu Option**: `[6] 📤 Export Data`

### What It Does
Export observations to various formats for sharing with team or analysis.

### Supported Formats

- **JSON** — Structured data, full content
- **CSV** — Spreadsheet format, for filtering/sorting
- **Markdown** — Readable format for documentation
- **XML** — For integrations

### How to Use

1. Select `[6]` from main menu
2. Choose format (JSON/CSV/MD/XML)
3. Choose range:
   - Selected observations
   - All in current filter
   - Entire project
4. Choose metadata to include:
   - Timestamps
   - Type & Scope
   - Topic keys
   - Full content
5. Choose output location (defaults to `~/Downloads/`)
6. Click [EXPORT]

### Example

```
┌──────────────────────────────────────────┐
│  Export Observations                     │
├──────────────────────────────────────────┤
│  Format: [JSON ▼]                        │
│  Range: [Selected (7 items) ▼]           │
│  Metadata: [☑] All                       │
│  Output: ~/Downloads/engram-export.json  │
│                                          │
│  [EXPORT]  [CHANGE PATH]  [CANCEL]       │
│                                          │
│  Tip: Share JSON/CSV with team easily    │
└──────────────────────────────────────────┘
```

### Example Export (JSON)

```json
{
  "project": "food-store-sdd",
  "exported_at": "2026-05-21T10:42:00Z",
  "observations": [
    {
      "id": 532,
      "title": "CH-026 Layout Separation",
      "type": "architecture",
      "scope": "project",
      "topic_key": "sdd/ecommerce-transformation",
      "created_at": "2026-05-21T09:42:00Z",
      "content": "**What**: Separate layouts...",
      "tags": ["ecommerce", "frontend", "layout"]
    }
  ]
}
```

---

## ⚙️ Feature 7: Settings

**Menu Option**: `[7] ⚙️  Settings`

### What It Does
Configure app preferences and defaults.

### Settings Available

**General**
- Default project
- Default scope (project/personal)
- Auto-refresh interval

**UI**
- Theme (light/dark/auto)
- Color scheme
- Font size
- Animation speed

**Export**
- Default export format
- Default export path
- Include metadata by default

**Keybindings**
- Default (arrow keys)
- Vim (hjkl navigation)
- Emacs (Ctrl+N/P)

### How to Use

1. Select `[7]` from main menu
2. Choose setting to change
3. Modify value
4. Changes auto-save
5. Press `B` to go back

---

## ⌨️ Keyboard Shortcuts

### Global

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move up/down |
| `←` / `→` | Move left/right |
| `Enter` | Select/Confirm |
| `Tab` | Next field |
| `Shift+Tab` | Previous field |
| `Escape` / `q` | Go back / Quit |
| `/` | Quick search |
| `?` | Help/keybindings |
| `Ctrl+C` | Force exit |

### In Lists

| Key | Action |
|-----|--------|
| `v` | View selected |
| `e` | Edit selected |
| `d` | Delete selected |
| `c` | Copy to clipboard |
| `x` | Export selected |
| `r` | Refresh |
| `*` | Select all |
| `0` | Deselect all |

### In Search

| Key | Action |
|-----|--------|
| `Enter` | Execute search |
| `Ctrl+U` | Clear search |
| `↑` / `↓` | Browse results |

---

## 🎯 Common Tasks

### Task 1: Find a Specific Change

```bash
# Using search
engram-tui search "CH-026"

# Or in app:
# 1. Press [2] Search
# 2. Type "CH-026"
# 3. Press Enter
# 4. Click result to view
```

### Task 2: See All Bugfixes This Week

```bash
# 1. Press [4] Filter by Type
# 2. Select "Bugfix"
# 3. Filter by time: "1 week"
# 4. Browse results
```

### Task 3: Export All Decisions for Documentation

```bash
# 1. Press [4] Filter by Type
# 2. Select "Decision"
# 3. Press [6] Export
# 4. Choose "Markdown"
# 5. Export to ~/Downloads/
```

### Task 4: See Team Activity This Week

```bash
# 1. Press [5] Statistics
# 2. Look at "Activity Timeline"
# 3. See breakdown by day
```

### Task 5: Share Project Context with New Team Member

```bash
# 1. Press [3] Browse Projects
# 2. Select "food-store-sdd"
# 3. Press [6] Export
# 4. Export as JSON
# 5. Send file to teammate
```

---

## 🆘 Troubleshooting

### Problem: Search returns no results

**Solution**: 
- Try shorter keywords
- Check spelling
- Remove filters and retry
- Make sure you've selected correct project

### Problem: Can't find a specific observation

**Solution**:
- Use full-text search (press `/`)
- Try searching by topic key (e.g., "sdd/ch-026")
- Check if it's in a different project
- Check if it was deleted

### Problem: App is slow

**Solution**:
- Press `R` to refresh
- Reduce time range in filters
- Close other apps to free memory
- Restart app: `q` then `npm start`

### Problem: Export fails

**Solution**:
- Check write permissions on export path
- Try different format (JSON → CSV)
- Reduce range (fewer observations)
- Free up disk space

---

## 💡 Pro Tips

1. **Quick search** — Press `/` anytime to search globally
2. **Keyboard shortcuts** — Press `?` to see all keybindings in app
3. **Bulk export** — Export multiple observations at once as JSON
4. **Filter stacking** — Combine type + scope + time filters
5. **Topic search** — Search by topic key for grouped results
6. **Copy to clipboard** — Press `c` on observation to copy
7. **Refresh stats** — Stats auto-update; press `R` to force refresh
8. **Theme toggle** — Quick switch between light/dark in settings

---

## 🎓 Learning Resources

- **In-app help** — Press `?` anytime
- **INSTALLATION.md** — Setup guide
- **ENGRAM_TUI_SPEC.md** — Technical details
- **DEVELOPMENT.md** — Extend the app

---

**Enjoy exploring your Engram memory! 🚀**
