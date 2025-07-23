#!/bin/bash
# Vexel AI Agent Platform - Complete Startup Script
echo "🚀 Starting Vexel AI Agent Platform..."
echo "=================================================="

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend (FastAPI + Python 3.13 + UV)..."
    cd backend/app
    
    # Check if UV is installed
    if ! command -v uv &> /dev/null; then
        echo "❌ UV is not installed. Installing..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        export PATH="$HOME/.local/bin:$PATH"
    fi
    
    # Sync dependencies and start backend
    echo "📦 Syncing backend dependencies..."
    uv sync --python 3.13
    
    echo "🗄️ Initializing database..."
    uv run --python 3.13 python app/initial_data.py
    
    echo "🔥 Starting FastAPI server..."
    uv run --python 3.13 python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    
    cd ../..
    echo "✅ Backend started on http://localhost:8000 (PID: $BACKEND_PID)"
}

# Function to start frontend
start_frontend() {
    echo "🌐 Starting Frontend (Next.js + React 19 + Yarn)..."
    cd frontend
    
    # Check if Yarn is installed
    if ! command -v yarn &> /dev/null; then
        echo "❌ Yarn is not installed. Installing..."
        npm install -g yarn
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        yarn install
    fi
    
    echo "🔥 Starting Next.js development server..."
    yarn dev &
    FRONTEND_PID=$!
    
    cd ..
    echo "✅ Frontend started on http://localhost:3000 (PID: $FRONTEND_PID)"
}

# Function to check Docker services
check_docker_services() {
    echo "🐳 Checking Docker services..."
    if ! docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        echo "⚠️  Docker services not running. Starting them..."
        docker-compose -f docker-compose.dev.yml up -d
        echo "✅ Docker services started"
    else
        echo "✅ Docker services already running"
    fi
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Vexel..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    echo "👋 Goodbye!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
echo "🔍 Checking prerequisites..."

# Check Docker services
check_docker_services

# Check if ports are available
if check_port 8000; then
    echo "⚠️  Port 8000 is already in use. Backend might already be running."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if check_port 3000; then
    echo "⚠️  Port 3000 is already in use. Frontend might already be running."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start services
start_backend
sleep 3  # Give backend time to start

start_frontend
sleep 2  # Give frontend time to start

echo ""
echo "🎉 Vexel AI Agent Platform is now running!"
echo "=================================================="
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🌐 Frontend: http://localhost:3000"
echo "📧 MailHog: http://localhost:8025"
echo "🗄️ MongoDB: localhost:27017"
echo "🔍 Qdrant: http://localhost:6333"
echo "=================================================="
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
