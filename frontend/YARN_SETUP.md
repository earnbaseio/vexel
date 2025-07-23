# Vexel Frontend - Yarn Setup Guide

## 🚀 Quick Start with Yarn

This frontend is built with Next.js 15 + React 19 + TypeScript and uses Yarn as the package manager.

### Prerequisites

- **Node.js 18+**: Required for Next.js 15
- **Yarn**: Fast and reliable package manager

### Installation

1. **Install Yarn** (if not already installed):
```bash
npm install -g yarn
```

2. **Verify installation**:
```bash
yarn --version
```

### Development Workflow

#### 1. Initial Setup
```bash
cd frontend

# Install all dependencies
yarn install
```

#### 2. Start Development Server
```bash
# Option 1: Use the startup script
./start_frontend.sh

# Option 2: Manual start
yarn dev
```

#### 3. Access Frontend
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000 (must be running)

### Key Yarn Commands

```bash
# Install dependencies
yarn install

# Add new package
yarn add package-name

# Add dev dependency
yarn add --dev package-name

# Remove package
yarn remove package-name

# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run linting
yarn lint

# Format code
yarn format

# Upgrade all packages
yarn upgrade
```

### Project Structure

- `package.json` - Project configuration and dependencies
- `yarn.lock` - Locked dependency versions (like package-lock.json)
- `node_modules/` - Installed packages
- `.env.local` - Environment variables

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **React**: React 19
- **TypeScript**: Full type safety
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit + Redux Persist
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Headless UI + Heroicons
- **Animation**: Framer Motion

### Environment Variables

File: `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Available Scripts

- `yarn dev` - Start development server with Turbopack
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn format` - Format code with Prettier

### Benefits of Yarn

- ⚡ **Faster installs** than npm
- 🔒 **Deterministic installs** with yarn.lock
- 📦 **Better dependency resolution**
- 🔄 **Offline mode** support
- 🛡️ **Security features** built-in

### Troubleshooting

1. **Clear cache and reinstall**:
```bash
yarn cache clean
rm -rf node_modules yarn.lock
yarn install
```

2. **Port already in use**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

3. **TypeScript errors**:
```bash
# Restart TypeScript server in VS Code
Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

### Migration from npm

The project has been migrated from npm to Yarn:
- ✅ `package-lock.json` removed
- ✅ `yarn.lock` created
- ✅ All dependencies working with Yarn
- ✅ Scripts updated for Yarn workflow

---

**Happy coding with Yarn! 🧶**
