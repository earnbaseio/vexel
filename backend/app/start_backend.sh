#!/bin/bash
# Vexel Backend Startup Script with UV
echo "🚀 Starting Vexel AI Agent Platform Backend..."

# Check if UV is installed
if ! command -v uv &> /dev/null; then
    echo "❌ UV is not installed. Please install it first:"
    echo "curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Sync dependencies if needed
echo "📦 Syncing dependencies..."
uv sync --python 3.13

# Start the backend server
echo "🔥 Starting FastAPI server on http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "📖 ReDoc: http://localhost:8000/redoc"
echo ""
uv run --python 3.13 python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
