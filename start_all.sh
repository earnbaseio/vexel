#!/bin/bash

echo "Starting Vexel Development Environment..."

# Start Docker services
echo "Starting Docker services..."
cd /Users/tuan/Develop/personal/vexel/vexel
docker-compose -f docker-compose.dev.yml up -d

# Wait a bit for services to start
sleep 5

# Start Backend
echo "Starting Backend..."
cd /Users/tuan/Develop/personal/vexel/vexel/backend/app
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend..."
cd /Users/tuan/Develop/personal/vexel/vexel/frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Services started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"

# Keep script running
wait
