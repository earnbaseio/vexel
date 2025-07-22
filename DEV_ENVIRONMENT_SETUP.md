# Vexel AI Agent Platform - Development Environment Setup

## 📋 Prerequisites

- **Docker & Docker Compose** - For running services (MongoDB, Redis, Qdrant, MailHog)
- **Python 3.11+** - For backend development
- **Node.js 18+** - For frontend development
- **Git** - For version control

## 🚀 Quick Start Guide

### 1. Clone and Navigate to Project
```bash
cd /path/to/vexel/vexel
```

### 2. Start Required Services
```bash
# Start all required services using Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Check services status
docker-compose -f docker-compose.dev.yml ps
```

**Services Started:**
- **MongoDB**: `localhost:27017` (Database)
- **Redis**: `localhost:6379` (Cache & Queue)
- **Qdrant**: `localhost:6333` (Vector Database)
- **MailHog**: `localhost:8025` (Email Testing UI), `localhost:1025` (SMTP)

### 3. Initialize Database (First Time Only)
```bash
# Navigate to backend directory
cd backend/app

# Activate virtual environment
source venv/bin/activate

# Create initial data and superuser
python app/initial_data.py
```

### 4. Start Backend (FastAPI)
```bash
# In the same terminal (backend/app directory)
# Start backend with auto-reload
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend URLs:**
- **API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 5. Start Frontend (Next.js)
```bash
# Navigate to frontend directory (in new terminal)
cd frontend

# Start development server
npm run dev
```

**Frontend URL:**
- **Web App**: http://localhost:3000

## 🔧 Environment Configuration

### Backend Environment Variables
File: `backend/app/.env`

Key configurations:
```env
# Project
PROJECT_NAME=Vexel AI Agent Platform
SERVER_HOST=http://localhost:8000

# Database
MONGO_DATABASE_URI=mongodb://localhost:27017/vexel

# AI APIs
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]
```

### Frontend Environment Variables
File: `frontend/.env.local` (create if not exists)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🧪 Manual Testing Guidelines

### 1. Authentication Testing
- **Login**: http://localhost:3002/login (Use: admin@vexel.com / changethis)
- **Password Recovery**: http://localhost:3002/recover-password

**Default Superuser Credentials:**
- Email: `admin@vexel.com`
- Password: `changethis`

### 2. Core Features Testing
- **Dashboard**: http://localhost:3000/dashboard
- **Agent Management**: http://localhost:3000/agents
- **Chat Interface**: http://localhost:3000/chat
- **Workflows**: http://localhost:3000/workflows
- **Team Collaboration**: http://localhost:3000/collaboration
- **Knowledge Management**: http://localhost:3000/knowledge

### 3. API Testing
- **Swagger UI**: http://localhost:8000/docs
- Test endpoints directly through the interactive documentation

### 4. Email Testing
- **MailHog UI**: http://localhost:8025
- View all emails sent by the application

## 🛠️ Development Commands

### Backend Commands
```bash
cd backend/app

# Install dependencies
pip install -e .

# Run tests
python -m pytest

# Format code
python -m black app/
python -m isort app/

# Type checking
python -m mypy app/
```

### Frontend Commands
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## 🐳 Docker Services Management

### Start Services
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Stop Services
```bash
docker-compose -f docker-compose.dev.yml down
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f mongodb
```

### Reset Data
```bash
# Stop services and remove volumes
docker-compose -f docker-compose.dev.yml down -v

# Start fresh
docker-compose -f docker-compose.dev.yml up -d
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :8000  # Backend
   lsof -i :3000  # Frontend
   lsof -i :27017 # MongoDB
   ```

2. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB container
   docker logs vexel-mongodb-1
   
   # Test connection
   docker exec -it vexel-mongodb-1 mongosh
   ```

3. **Database Authentication Issues**
   ```bash
   # Recreate initial data
   cd backend/app
   source venv/bin/activate
   python app/initial_data.py
   ```

4. **Backend Dependencies Issues**
   ```bash
   cd backend/app
   pip install -e . --force-reinstall
   ```

5. **Frontend Build Issues**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📊 Service Health Checks

### Quick Health Check Script
```bash
#!/bin/bash
echo "🔍 Checking Vexel Services..."

# Check Docker services
echo "📦 Docker Services:"
docker-compose -f docker-compose.dev.yml ps

# Check Backend
echo "🔧 Backend API:"
curl -s http://localhost:8000/api/v1/health || echo "❌ Backend not responding"

# Check Frontend
echo "🌐 Frontend:"
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend not responding"

# Check MongoDB
echo "🗄️ MongoDB:"
docker exec vexel-mongodb-1 mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1 && echo "✅ MongoDB OK" || echo "❌ MongoDB not responding"

# Check Redis
echo "📦 Redis:"
docker exec vexel-redis-1 redis-cli ping > /dev/null 2>&1 && echo "✅ Redis OK" || echo "❌ Redis not responding"
```

## 🎯 Testing Checklist

- [ ] All Docker services running
- [ ] Backend API responding at http://localhost:8000
- [ ] Frontend loading at http://localhost:3000
- [ ] API documentation accessible at http://localhost:8000/docs
- [ ] User registration/login working
- [ ] Agent creation and management
- [ ] Chat interface functional
- [ ] Workflow execution
- [ ] Knowledge upload and retrieval
- [ ] Email notifications (check MailHog)

## 📝 Notes

- **Development Mode**: Both backend and frontend run with hot reload
- **Database**: MongoDB data persists in Docker volume
- **Logs**: Check terminal outputs for real-time debugging
- **API Keys**: Update `.env` with your actual API keys for full functionality
- **CORS**: Frontend (3000) is allowed to access Backend (8000)

---

**Happy Testing! 🚀**
