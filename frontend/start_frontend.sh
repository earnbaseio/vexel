#!/bin/bash
# Vexel Frontend Startup Script with Yarn
echo "🚀 Starting Vexel AI Agent Platform Frontend..."

# Check if Yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed. Please install it first:"
    echo "npm install -g yarn"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

# Start the development server
echo "🔥 Starting Next.js development server on http://localhost:3000"
echo "🌐 Frontend will connect to backend at: http://localhost:8000"
echo ""
yarn dev
