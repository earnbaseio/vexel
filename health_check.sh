#!/bin/bash
echo "🔍 Checking Vexel Services..."

# Check Docker services
echo "📦 Docker Services:"
/usr/local/bin/docker-compose -f docker-compose.dev.yml ps

# Check Backend
echo "🔧 Backend API:"
curl -s http://localhost:8000/api/v1/users/tester > /dev/null && echo "✅ Backend OK" || echo "❌ Backend not responding"

# Check Frontend
echo "🌐 Frontend:"
curl -s http://localhost:3002 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend not responding"

# Check MongoDB
echo "🗄️ MongoDB:"
/usr/local/bin/docker exec vexel-mongodb-1 mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1 && echo "✅ MongoDB OK" || echo "❌ MongoDB not responding"

# Check Redis
echo "📦 Redis:"
/usr/local/bin/docker exec vexel-redis-1 redis-cli ping > /dev/null 2>&1 && echo "✅ Redis OK" || echo "❌ Redis not responding"

# Check Qdrant
echo "🔍 Qdrant:"
curl -s http://localhost:6333/health > /dev/null && echo "✅ Qdrant OK" || echo "❌ Qdrant not responding"

# Check MailHog
echo "📧 MailHog:"
curl -s http://localhost:8025 > /dev/null && echo "✅ MailHog OK" || echo "❌ MailHog not responding"

echo "🎯 Health Check Complete!"
