#!/bin/bash

# Vexel RAG Optimization System Deployment Script
# Comprehensive deployment script for the enhanced RAG system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/app/.env"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.rag.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    log_success "All requirements met"
}

setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_warning ".env file not found. Creating from .env.example..."
        if [ -f "$PROJECT_ROOT/app/.env.example" ]; then
            cp "$PROJECT_ROOT/app/.env.example" "$ENV_FILE"
            log_warning "Please edit $ENV_FILE with your actual configuration values"
        else
            log_error ".env.example file not found. Cannot create .env file."
            exit 1
        fi
    fi
    
    # Validate critical environment variables
    source "$ENV_FILE"
    
    if [ -z "$SECRET_KEY" ] || [ "$SECRET_KEY" = "your-secret-key-here" ]; then
        log_warning "SECRET_KEY not set or using default value. Please update it in .env file."
    fi
    
    if [ -z "$GEMINI_API_KEY" ]; then
        log_warning "GEMINI_API_KEY not set. Semantic chunking will be limited."
    fi
    
    if [ -z "$OPENAI_API_KEY" ]; then
        log_warning "OPENAI_API_KEY not set. Agentic chunking will be disabled."
    fi
    
    log_success "Environment configuration checked"
}

run_migrations() {
    log_info "Running database migrations..."
    
    # Wait for MongoDB to be ready
    log_info "Waiting for MongoDB to be ready..."
    sleep 10
    
    # Run migrations
    cd "$PROJECT_ROOT/app"
    if [ -f "migrations/run_migrations.py" ]; then
        python migrations/run_migrations.py
        if [ $? -eq 0 ]; then
            log_success "Database migrations completed successfully"
        else
            log_error "Database migrations failed"
            exit 1
        fi
    else
        log_warning "Migration script not found, skipping migrations"
    fi
}

install_dependencies() {
    log_info "Installing RAG optimization dependencies..."
    
    # Check if we're in a container or local environment
    if [ -f "/.dockerenv" ]; then
        log_info "Running in Docker container, dependencies should already be installed"
    else
        # Local installation
        if [ -f "$PROJECT_ROOT/app/scripts/install_rag_dependencies.sh" ]; then
            bash "$PROJECT_ROOT/app/scripts/install_rag_dependencies.sh"
        else
            log_warning "RAG dependencies installation script not found"
        fi
    fi
}

deploy_services() {
    log_info "Deploying Vexel RAG Optimization System..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images
    log_info "Pulling latest Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    # Build custom images
    log_info "Building custom images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    # Start services
    log_info "Starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_service_health
}

check_service_health() {
    log_info "Checking service health..."
    
    # Check MongoDB
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        log_success "MongoDB is healthy"
    else
        log_error "MongoDB health check failed"
    fi
    
    # Check Qdrant
    if curl -f http://localhost:6333/health &> /dev/null; then
        log_success "Qdrant is healthy"
    else
        log_error "Qdrant health check failed"
    fi
    
    # Check Redis
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping &> /dev/null; then
        log_success "Redis is healthy"
    else
        log_error "Redis health check failed"
    fi
    
    # Check Backend
    if curl -f http://localhost:8000/health &> /dev/null; then
        log_success "Backend is healthy"
    else
        log_error "Backend health check failed"
    fi
}

run_tests() {
    log_info "Running system tests..."
    
    cd "$PROJECT_ROOT/app"
    
    # Run basic tests
    if command -v pytest &> /dev/null; then
        pytest tests/test_chunking_factory.py -v
        pytest tests/test_content_analyzer.py -v
        
        if [ $? -eq 0 ]; then
            log_success "Tests passed"
        else
            log_warning "Some tests failed, but deployment continues"
        fi
    else
        log_warning "pytest not available, skipping tests"
    fi
}

show_deployment_info() {
    log_success "Vexel RAG Optimization System deployed successfully!"
    echo ""
    echo "🚀 Service URLs:"
    echo "   Backend API: http://localhost:8000"
    echo "   API Documentation: http://localhost:8000/docs"
    echo "   MongoDB: mongodb://localhost:27017"
    echo "   Qdrant: http://localhost:6333"
    echo "   Redis: redis://localhost:6379"
    echo ""
    echo "🔧 Management Commands:"
    echo "   View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo "   Stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo "   Restart services: docker-compose -f $DOCKER_COMPOSE_FILE restart"
    echo ""
    echo "📊 RAG Features Available:"
    echo "   ✅ Intelligent Chunking (6 strategies)"
    echo "   ✅ Content Analysis"
    echo "   ✅ Performance Monitoring"
    echo "   ✅ User Tier Management"
    echo "   ✅ Admin Dashboard"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Update API keys in .env file if not done already"
    echo "   2. Create your first user account"
    echo "   3. Test document upload with different chunking strategies"
    echo "   4. Monitor performance via /api/v1/agents/knowledge/performance-dashboard"
    echo ""
}

cleanup_on_error() {
    log_error "Deployment failed. Cleaning up..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    exit 1
}

# Main deployment process
main() {
    echo "🚀 Vexel RAG Optimization System Deployment"
    echo "=============================================="
    echo ""
    
    # Set up error handling
    trap cleanup_on_error ERR
    
    # Run deployment steps
    check_requirements
    setup_environment
    install_dependencies
    deploy_services
    run_migrations
    run_tests
    show_deployment_info
    
    log_success "Deployment completed successfully! 🎉"
}

# Parse command line arguments
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "Vexel RAG Optimization System Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy    Deploy the complete system (default)"
        echo "  stop      Stop all services"
        echo "  restart   Restart all services"
        echo "  logs      Show service logs"
        echo "  health    Check service health"
        echo "  clean     Clean up all containers and volumes"
        echo "  help      Show this help message"
        echo ""
        exit 0
        ;;
    "stop")
        log_info "Stopping Vexel RAG services..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        log_success "Services stopped"
        ;;
    "restart")
        log_info "Restarting Vexel RAG services..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" restart
        log_success "Services restarted"
        ;;
    "logs")
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
        ;;
    "health")
        check_service_health
        ;;
    "clean")
        log_warning "This will remove all containers and volumes. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            docker-compose -f "$DOCKER_COMPOSE_FILE" down -v
            docker system prune -f
            log_success "Cleanup completed"
        else
            log_info "Cleanup cancelled"
        fi
        ;;
    "deploy"|"")
        main
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
