# .engram — Engram TUI Documentation

**Status**: 📦 Ready for Team  
**Last Updated**: 2026-05-21  
**For**: food-store-sdd team

---

## 📋 What Is This?

**Engram TUI** is a **Terminal User Interface** to explore and manage your Engram memory observations without complex CLI commands.

### Quick Start

```bash
# Navigate to project
cd FOOD-STORE-SDD/.engram/engram-tui

# Install & run
npm install
npm start

# Or globally (if linked)
engram-tui
```

Press arrow keys to navigate, Enter to select, `q` to quit.

---

## 📂 Documentation Index

| File | Purpose | For |
|------|---------|-----|
| **README.md** (this file) | Overview & quick start | Everyone |
| **ENGRAM_TUI_SPEC.md** | Full feature specification | Architects, tech leads |
| **INSTALLATION.md** | Step-by-step setup guide | New team members |
| **USAGE.md** | How to use the app | All users |
| **DEVELOPMENT.md** | Architecture & contributing | Developers |

---

## 🎯 Main Features

### 1️⃣ Browse Projects
Explore all your Engram projects and observations organized by project.

### 2️⃣ Search Observations
Full-text search with filtering by type, scope, and time range.

### 3️⃣ View Recent
See most recently created/modified observations across projects.

### 4️⃣ Filter by Type
Group and view observations by type (architecture, bugfix, decision, etc).

### 5️⃣ Statistics Dashboard
Detailed analytics about memory usage (by type, scope, time, top topics).

### 6️⃣ Export Data
Export observations to JSON, CSV, Markdown, or XML formats.

### 7️⃣ Settings
Configure defaults, theme, keybindings, and export preferences.

---

## 🚀 Installation Quick Start

### For Everyone

1. **Navigate to project**
   ```bash
   cd FOOD-STORE-SDD/.engram/engram-tui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run**
   ```bash
   npm start
   ```

4. **Explore** with arrow keys ↑↓, Enter to select, `q` to quit

### For Developers

See [INSTALLATION.md](./INSTALLATION.md) for detailed setup, platform-specific notes, troubleshooting.

---

## 📖 Usage Examples

### Example 1: Find a Specific Change

```bash
# Method 1: Command line
engram-tui search "CH-026"

# Method 2: In app
# 1. Press [2] Search
# 2. Type "CH-026"
# 3. Press Enter
```

### Example 2: See All Bugfixes

```bash
# In app:
# 1. Press [4] Filter by Type
# 2. Select "Bugfix"
# 3. Browse results
```

### Example 3: Export Decisions for Documentation

```bash
# In app:
# 1. Press [4] Filter by Type
# 2. Select "Decision"
# 3. Press [6] Export
# 4. Choose Markdown format
# 5. Select output location
```

### Example 4: View Team Activity

```bash
# In app:
# 1. Press [5] Statistics
# 2. See "Activity Timeline (last 7 days)"
# 3. View breakdown by type, scope, topic
```

---

## ⌨️ Essential Keyboard Shortcuts

```
Navigation:
  ↑ / ↓     Move up/down
  Enter     Select/Confirm
  q         Go back / Quit

Search:
  /         Quick search
  ?         Help & keybindings

Actions:
  v         View selected
  e         Edit selected
  d         Delete selected
  x         Export selected
  r         Refresh
```

For full list, see [USAGE.md](./USAGE.md) or press `?` in app.

---

## 💾 Full Documentation

### For Users
- 👉 **[USAGE.md](./USAGE.md)** — How to use all 7 features + common tasks + troubleshooting

### For New Developers
- 👉 **[INSTALLATION.md](./INSTALLATION.md)** — Setup instructions + platform-specific notes + verification

### For Contributors
- 👉 **[DEVELOPMENT.md](./DEVELOPMENT.md)** — Architecture + hooks + testing + adding features

### For Architects
- 👉 **[ENGRAM_TUI_SPEC.md](./ENGRAM_TUI_SPEC.md)** — Complete feature spec + technical design + roadmap

---

## 🎓 Getting Started Checklist

- [ ] Read this README
- [ ] Run `npm install` in `.engram/engram-tui/`
- [ ] Run `npm start` to launch the app
- [ ] Navigate with arrow keys ↑↓
- [ ] Try searching for a change (e.g., "CH-026")
- [ ] View statistics [5]
- [ ] Export something to JSON [6]
- [ ] Read [USAGE.md](./USAGE.md) for detailed guide

---

## 🔧 Tech Stack

```
Runtime:       Node.js 18+
Language:      TypeScript
Framework:     Ink (React for Terminal)
UI Components: ink-select-input, ink-text-input, chalk
Testing:       Jest + React Testing Library
Build:         esbuild + TypeScript
```

---

## 🗂️ Project Structure

```
.engram/
├── README.md ........................ (this file)
├── ENGRAM_TUI_SPEC.md .............. Full specification
├── INSTALLATION.md ................. Setup guide
├── USAGE.md ......................... How-to guide
├── DEVELOPMENT.md .................. Dev guide
│
└── engram-tui/             (The actual app)
    ├── src/               (TypeScript source)
    ├── bin/               (CLI entry point)
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

---

## 🚨 Troubleshooting

### "npm: command not found"
→ Install Node.js from https://nodejs.org/

### "No such file or directory"
→ Ensure you're in `.engram/engram-tui/` directory (run `pwd` to check)

### Search returns no results
→ Try shorter keywords, check spelling, remove filters

### App is slow
→ Press `R` to refresh, reduce filters, restart app

For more, see [INSTALLATION.md § Troubleshooting](./INSTALLATION.md#-troubleshooting) or [USAGE.md § Troubleshooting](./USAGE.md#-troubleshooting).

---

## ❓ Frequently Asked Questions

**Q: Can I use Engram TUI on Mac/Linux/Windows?**  
A: Yes! Node.js runs on all platforms. See [INSTALLATION.md](./INSTALLATION.md) for platform-specific notes.

**Q: Do I need internet connection?**  
A: No, it works offline (reads local Engram memory).

**Q: Can I edit/delete observations?**  
A: Yes, select observation and press `e` to edit or `d` to delete.

**Q: Can I share observations?**  
A: Yes! Export to JSON/CSV/Markdown and share the file.

**Q: How do I contribute?**  
A: See [DEVELOPMENT.md](./DEVELOPMENT.md) and create a PR.

**Q: Where are observations stored?**  
A: In your Engram backend (local or remote). Config in `~/.config/opencode/engram.json`.

---

## 🎯 Common Commands

```bash
# Navigate to engram-tui
cd FOOD-STORE-SDD/.engram/engram-tui

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Link globally (so you can run `engram-tui` from anywhere)
npm link

# Check for lint issues
npm run lint

# Fix lint issues automatically
npm run lint --fix
```

---

## 📞 Getting Help

| Need | Where |
|------|-------|
| How to use the app? | Read [USAGE.md](./USAGE.md) |
| Setup issues? | Read [INSTALLATION.md](./INSTALLATION.md) |
| Want to contribute? | Read [DEVELOPMENT.md](./DEVELOPMENT.md) |
| Technical details? | Read [ENGRAM_TUI_SPEC.md](./ENGRAM_TUI_SPEC.md) |
| In-app help | Press `?` while running engram-tui |
| Ask teammates | Slack: #engineering-tools |

---

## 📈 Roadmap

### v1.0 (Current)
- ✅ Browse projects
- ✅ Search observations
- ✅ View recent
- ✅ Filter by type
- ✅ Statistics dashboard
- ✅ Export (JSON/CSV/MD/XML)

### v1.1 (Planned)
- [ ] Edit observations
- [ ] Bookmarks/favorites
- [ ] Inline preview
- [ ] Theme customization

### v2.0 (Future)
- [ ] Team collaboration
- [ ] AI-powered tagging
- [ ] Git commit integration

---

## 🙏 Thank You

This tool was created to make your development experience better. If you find it useful, or have ideas for improvements, please share feedback!

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-21 | Initial release |

---

**Happy exploring! 🚀**

For detailed documentation, start with:
1. [USAGE.md](./USAGE.md) — How to use
2. [INSTALLATION.md](./INSTALLATION.md) — Setup help
3. [DEVELOPMENT.md](./DEVELOPMENT.md) — For contributors

---

**Last Updated**: 2026-05-21 | **Status**: Ready for Team ✅
