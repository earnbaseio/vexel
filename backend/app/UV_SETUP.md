# Vexel Backend - UV Setup Guide

## 🚀 Quick Start with UV

UV is a fast Python package manager that replaces pip and virtualenv. This project is now configured to use UV with Python 3.13+.

### Prerequisites

- **UV**: Fast Python package manager
- **Python 3.13+**: Required for this project

### Installation

1. **Install UV** (if not already installed):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. **Add UV to PATH** (restart shell or run):
```bash
source $HOME/.local/bin/env
```

### Development Workflow

#### 1. Initial Setup
```bash
cd backend/app

# Sync all dependencies (creates .venv automatically)
uv sync --python 3.13
```

#### 2. Start Backend Server
```bash
# Option 1: Use the startup script
./start_backend.sh

# Option 2: Manual start
uv run --python 3.13 python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Initialize Database (First time only)
```bash
uv run --python 3.13 python app/initial_data.py
```

### Key UV Commands

```bash
# Install new package
uv add package-name

# Install dev dependency
uv add --dev package-name

# Remove package
uv remove package-name

# Sync dependencies (install from pyproject.toml)
uv sync

# Run Python scripts
uv run python script.py

# Run with specific Python version
uv run --python 3.13 python script.py

# Update all packages
uv sync --upgrade

# Lock dependencies
uv lock
```

### Project Structure

- `pyproject.toml` - Project configuration and dependencies
- `uv.lock` - Locked dependency versions (like package-lock.json)
- `.venv/` - Virtual environment (auto-created by UV)

### Backend URLs

- **API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Benefits of UV

- ⚡ **10-100x faster** than pip
- 🔒 **Automatic dependency resolution**
- 📦 **Built-in virtual environment management**
- 🐍 **Python version management**
- 🔄 **Reproducible builds** with uv.lock

### Troubleshooting

1. **Python version issues**:
```bash
uv python install 3.13
uv sync --python 3.13
```

2. **Dependency conflicts**:
```bash
uv sync --refresh
```

3. **Clean reinstall**:
```bash
rm -rf .venv uv.lock
uv sync --python 3.13
```

### Migration from pip/venv

The project has been migrated from traditional pip/venv to UV:
- All dependencies are now in `pyproject.toml`
- No more `requirements.txt` files needed
- Virtual environment is managed automatically
- Faster installs and better dependency resolution

---

**Happy coding with UV! 🚀**
