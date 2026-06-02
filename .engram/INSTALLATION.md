# Engram TUI — Installation Guide

**Last Updated**: 2026-05-21  
**For**: food-store-sdd team

---

## 📋 Prerequisites

Before installing Engram TUI, make sure you have:

- ✅ **Node.js 18+** (LTS recommended)
- ✅ **npm 9+** or **pnpm 8+**
- ✅ **Git** (to clone/pull changes)
- ✅ **Terminal/CLI** (bash, zsh, PowerShell, cmd)
- ✅ **Engram access** (API key via `~/.config/opencode/engram.json`)

### Check Your Setup

```bash
# Check Node.js
node --version          # Should be v18.0.0 or higher

# Check npm
npm --version           # Should be 9.0.0 or higher

# Check Git
git --version           # Should be 2.x+

# Check Engram (optional, but recommended)
ls ~/.config/opencode/engram.json
```

---

## 🚀 Installation Steps

### Step 1: Pull Latest Changes

If you haven't already, sync the repo:

```bash
cd FOOD-STORE-SDD
git pull origin main
```

### Step 2: Navigate to engram-tui

```bash
cd .engram/engram-tui
```

### Step 3: Install Dependencies

```bash
# Using npm
npm install

# OR using pnpm (faster)
pnpm install

# OR using yarn
yarn install
```

Output should look like:
```
added 127 packages in 2.5s
```

### Step 4: Build (Optional for Development)

```bash
# For development (watch mode)
npm run dev

# For production build
npm run build
```

### Step 5: Link Globally (Optional)

Make `engram-tui` available anywhere on your system:

```bash
# Link globally
npm link

# Now you can run from anywhere
engram-tui

# Or unlink later if needed
npm unlink -g engram-tui
```

---

## ✅ Verify Installation

### Test 1: Direct Execution

```bash
# From .engram/engram-tui directory
npm start

# You should see:
# ┌──────────────────────────────────────────┐
# │  ENGRAM MEMORY BROWSER v1.0              │
# ├──────────────────────────────────────────┤
# │  [1] 📁 Browse Projects                 │
# │  [2] 🔍 Search Observations             │
# │  ...
```

Press `q` to quit.

### Test 2: Help Command

```bash
engram-tui --help

# Should output:
# Usage: engram-tui [options] [command]
#
# Options:
#   -v, --version         Show version
#   -p, --project <name>  Select project
#   -h, --help            Show help
#
# Commands:
#   search <query>        Quick search
#   stats [project]       View statistics
#   export [options]      Export data
#   help [command]        Show command help
```

### Test 3: List Projects

```bash
engram-tui --version

# Should output:
# engram-tui v1.0.0
```

---

## 🔧 Configuration

### Engram Connection

Engram TUI reads from your Engram config automatically. If you haven't set it up:

```bash
# Check if config exists
cat ~/.config/opencode/engram.json

# If not, create it (ask your tech lead for API key)
mkdir -p ~/.config/opencode
cat > ~/.config/opencode/engram.json << 'EOF'
{
  "api_url": "http://localhost:8000",
  "api_key": "your-key-here",
  "default_project": "food-store-sdd"
}
EOF
```

### Project Defaults

Create `.engram-config.json` in your project root to set defaults:

```bash
cat > FOOD-STORE-SDD/.engram-config.json << 'EOF'
{
  "default_project": "food-store-sdd",
  "default_scope": "project",
  "theme": "auto",
  "export_path": "./exports",
  "keybindings": "vim"
}
EOF
```

---

## 🖥️ Platform-Specific Notes

### Windows (PowerShell/CMD)

```powershell
# Navigate to project
cd C:\Users\YourName\Desktop\FOOD-STORE-SDD\.engram\engram-tui

# Install
npm install

# Run
npm start
```

If you get `npm: command not found`, install Node.js from https://nodejs.org/

### macOS

```bash
# Using Homebrew (recommended)
brew install node

# Or download from https://nodejs.org/

# Navigate and install
cd /Users/YourName/Desktop/FOOD-STORE-SDD/.engram/engram-tui
npm install
npm start
```

### Linux

```bash
# Using package manager (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install nodejs npm

# Or using nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18

# Navigate and install
cd ~/Desktop/FOOD-STORE-SDD/.engram/engram-tui
npm install
npm start
```

---

## 🐛 Troubleshooting

### Problem: `npm: command not found`

**Solution**: Install Node.js from https://nodejs.org/
- Download LTS version (18+)
- Run installer
- Restart terminal
- Test: `node --version`

### Problem: `Permission denied` when running

**Solution**: Make script executable

```bash
chmod +x engram-tui/bin/cli.js
npm start
```

### Problem: Port already in use (if running locally)

**Solution**: Use different port

```bash
PORT=3001 npm start
```

### Problem: `ENOENT: no such file or directory`

**Solution**: Ensure you're in the right directory

```bash
# Should be in .engram/engram-tui/
pwd           # or cd on Windows
ls            # You should see package.json

npm install
```

### Problem: Module not found errors

**Solution**: Reinstall node_modules

```bash
rm -rf node_modules package-lock.json
npm install
```

### Problem: Engram API connection fails

**Solution**: Check Engram config

```bash
# Verify config exists
cat ~/.config/opencode/engram.json

# Check if API is running
curl http://localhost:8000/health

# If not running, check with tech lead
```

---

## 📚 Next Steps

1. ✅ **Run the app** — `npm start` from `.engram/engram-tui/`
2. 📖 **Read USAGE.md** — Learn how to use it
3. 💻 **Explore your projects** — Browse existing observations
4. 🔍 **Try search** — Search for "CH-026" or your project
5. 📤 **Export** — Try exporting to JSON
6. 👨‍💻 **Contribute** — See DEVELOPMENT.md if interested

---

## 🆘 Getting Help

### Command Help
```bash
# General help
engram-tui --help

# Command-specific help
engram-tui search --help
engram-tui export --help

# In-app help
# Press ? while running
```

### From Within the App
- Press `?` to see keybindings
- Press `h` for help menu
- Press `q` to go back

### Ask the Team
- 💬 Slack: #engineering-tools
- 📧 Email: tech-lead@example.com
- 🐛 GitHub Issues: food-store-sdd/issues

---

## 🎉 You're Ready!

Once installation completes successfully:

```bash
npm start
```

You should see the main menu. Welcome to Engram TUI! 🚀

---

**Questions?** Check USAGE.md or ask your tech lead.
