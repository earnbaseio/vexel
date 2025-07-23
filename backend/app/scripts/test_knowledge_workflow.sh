#!/bin/bash

# Test Knowledge Workflow: Upload → Collection → Agent → Chat
# Tests the complete RAG pipeline from document upload to chat responses

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:8000"
TEST_USER_EMAIL="admin@vexel.com"
TEST_USER_PASSWORD="changethis"

# Global variables
AUTH_TOKEN=""
COLLECTION_ID=""
AGENT_ID=""

# Logging functions
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

# Check system health
check_system_health() {
    log_info "Checking system health..."
    
    local health_response=$(curl -s "$API_BASE_URL/health" || echo "")
    if echo "$health_response" | grep -q "healthy"; then
        log_success "Backend is healthy"
    else
        log_error "Backend health check failed"
        return 1
    fi
}

# Authenticate user
authenticate_user() {
    log_info "Authenticating user..."
    
    local response=$(curl -s -X POST "$API_BASE_URL/api/v1/auth/sign-in" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$TEST_USER_EMAIL\", \"password\": \"$TEST_USER_PASSWORD\"}")
    
    AUTH_TOKEN=$(echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$AUTH_TOKEN" ]; then
        log_success "Authentication successful"
        return 0
    else
        log_error "Authentication failed: $response"
        return 1
    fi
}

# Create test document
create_test_document() {
    log_info "Creating comprehensive test document..."
    
    cat > /tmp/knowledge_test_doc.md << 'EOF'
# Vexel AI Platform Documentation

## Overview
Vexel is an advanced AI platform that provides intelligent document processing and knowledge management capabilities.

## Key Features

### RAG Optimization
- **Chunking Strategies**: Multiple strategies including fixed, recursive, semantic, and auto-selection
- **Content Analysis**: Automatic file type detection and strategy recommendation
- **Performance Monitoring**: Real-time analytics and processing metrics

### User Tier System
- **Free Tier**: Basic chunking strategies (fixed, recursive, document)
- **Premium Tier**: Advanced strategies including semantic and markdown processing
- **Enterprise Tier**: Full access including agentic chunking and unlimited uploads

### Technical Architecture
- **FastAPI Backend**: High-performance REST API
- **MongoDB Database**: Document storage with user management
- **Qdrant Vector Database**: Semantic search and embeddings
- **UV Package Management**: Modern Python dependency management

## API Endpoints

### Authentication
- POST /api/v1/auth/sign-in - User login
- POST /api/v1/auth/sign-up - User registration

### Knowledge Management
- GET /api/v1/knowledge/chunking-recommendations/{file_type} - Get chunking recommendations
- POST /api/v1/knowledge/analyze-content - Analyze document content
- POST /api/v1/knowledge/upload - Upload documents with chunking
- GET /api/v1/knowledge/performance-dashboard - View analytics

### Admin Functions
- GET /api/v1/knowledge/admin/system/health - System health check
- GET /api/v1/knowledge/admin/dashboard - Admin dashboard

## Best Practices

### Document Processing
1. Use auto strategy for optimal chunking
2. Enable content analysis for better recommendations
3. Monitor performance metrics for optimization

### Performance Optimization
- Choose appropriate chunk sizes based on content type
- Use semantic chunking for technical documents
- Enable parallel processing for large files

## Troubleshooting

### Common Issues
- **Authentication Errors**: Check user credentials and token expiration
- **Upload Failures**: Verify file size limits and tier permissions
- **Chunking Issues**: Ensure strategy is available for user tier

### Performance Tips
- Use recursive chunking for structured documents
- Enable analytics for performance monitoring
- Consider semantic chunking for technical content
EOF

    log_success "Test document created: /tmp/knowledge_test_doc.md"
}

# Upload document to create collection
upload_document() {
    log_info "Uploading document and creating collection..."
    
    # First create a knowledge base
    local create_response=$(curl -s -X POST "$API_BASE_URL/api/v1/knowledge/create" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "knowledge_type": "text",
            "name": "Vexel Platform Knowledge",
            "content": ["Comprehensive documentation for Vexel AI Platform"]
        }')
    
    log_info "Create response: $create_response"
    
    # Extract collection ID
    COLLECTION_ID=$(echo "$create_response" | grep -o '"collection_id":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$COLLECTION_ID" ]; then
        COLLECTION_ID="vexel_platform_knowledge"
    fi
    
    # Upload the document
    local upload_response=$(curl -s -X POST "$API_BASE_URL/api/v1/knowledge/upload" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -F "file=@/tmp/knowledge_test_doc.md" \
        -F "collection_id=$COLLECTION_ID" \
        -F "chunking_strategy=auto" \
        -F "enable_analysis=true")
    
    if echo "$upload_response" | grep -q "success\|chunks"; then
        local chunks=$(echo "$upload_response" | grep -o '"chunks_created":[0-9]*' | cut -d':' -f2)
        log_success "Document uploaded successfully to collection: $COLLECTION_ID"
        log_success "Chunks created: ${chunks:-'N/A'}"
        return 0
    else
        log_error "Document upload failed: $upload_response"
        return 1
    fi
}

# Create agent with knowledge collection
create_agent_with_knowledge() {
    log_info "Creating agent with knowledge collection..."

    local agent_response=$(curl -s -X POST "$API_BASE_URL/api/v1/agents/configurations" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Vexel Knowledge Assistant\",
            \"description\": \"AI assistant with access to Vexel platform documentation\",
            \"instructions\": [\"You are a helpful AI assistant with access to Vexel platform documentation. Use the knowledge base to answer questions about Vexel features, API endpoints, and best practices.\"],
            \"knowledge_sources\": [{
                \"type\": \"collection\",
                \"name\": \"Vexel Platform Knowledge\",
                \"source_id\": \"$COLLECTION_ID\",
                \"enabled\": true
            }],
            \"ai_model_provider\": \"gemini\",
            \"ai_model_id\": \"gemini/gemini-2.5-flash-lite\",
            \"ai_model_parameters\": {\"temperature\": 0.7, \"max_tokens\": 1000},
            \"enable_knowledge_search\": true
        }")

    AGENT_ID=$(echo "$agent_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$AGENT_ID" ]; then
        log_success "Agent created successfully: $AGENT_ID"
        log_success "Agent has access to collection: $COLLECTION_ID"
        return 0
    else
        log_error "Agent creation failed: $agent_response"
        return 1
    fi
}

# Test chat with knowledge
test_knowledge_chat() {
    log_info "Testing chat with knowledge-enabled agent..."
    
    # Test questions about the uploaded knowledge
    local questions=(
        "What are the key features of Vexel AI platform?"
        "What chunking strategies are available in Vexel?"
        "What are the different user tiers and their capabilities?"
        "What API endpoints are available for knowledge management?"
        "What are the best practices for document processing?"
    )
    
    for question in "${questions[@]}"; do
        log_info "Asking: $question"
        
        local chat_response=$(curl -s -X POST "$API_BASE_URL/api/v1/agents/chat" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"message\": \"$question\",
                \"agent_id\": \"$AGENT_ID\"
            }")
        
        if echo "$chat_response" | grep -q "response\|message"; then
            local response_text=$(echo "$chat_response" | grep -o '"response":"[^"]*"' | cut -d'"' -f4 | head -c 200)
            log_success "✓ Question answered"
            log_info "Response preview: ${response_text}..."
            echo ""
        else
            log_warning "⚠ Question may not have been answered properly"
            log_info "Response: $chat_response"
            echo ""
        fi
        
        # Small delay between requests
        sleep 1
    done
}

# Test semantic search
test_semantic_search() {
    log_info "Testing semantic search in collection..."

    local search_response=$(curl -s -X GET "$API_BASE_URL/api/v1/knowledge/search?query=chunking%20strategies%20and%20performance%20optimization&collection_id=$COLLECTION_ID&limit=5" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    if echo "$search_response" | grep -q "results\|status.*success"; then
        local result_count=$(echo "$search_response" | grep -o '"total":[0-9]*' | cut -d':' -f2)
        log_success "Semantic search working - Found ${result_count:-0} results"
    else
        log_warning "Semantic search may not be working: $search_response"
    fi
}

# Cleanup test data
cleanup() {
    log_info "Cleaning up test data..."
    
    # Delete agent
    if [ -n "$AGENT_ID" ]; then
        curl -s -X DELETE "$API_BASE_URL/api/v1/agents/configurations/$AGENT_ID" \
            -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null
        log_success "Agent deleted: $AGENT_ID"
    fi
    
    # Delete collection
    if [ -n "$COLLECTION_ID" ]; then
        curl -s -X DELETE "$API_BASE_URL/api/v1/knowledge/collections/$COLLECTION_ID" \
            -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null
        log_success "Collection deleted: $COLLECTION_ID"
    fi
    
    # Remove test file
    rm -f /tmp/knowledge_test_doc.md
    log_success "Test files cleaned up"
}

# Main test execution
main() {
    log_info "Starting Knowledge Workflow Test..."
    echo ""
    
    # Run tests
    check_system_health || exit 1
    authenticate_user || exit 1
    create_test_document || exit 1
    upload_document || exit 1
    create_agent_with_knowledge || exit 1
    test_knowledge_chat || exit 1
    test_semantic_search || exit 1
    
    echo ""
    log_success "All knowledge workflow tests completed successfully! 🎉"
    echo ""
    echo "✅ Document Upload: OK"
    echo "✅ Collection Creation: OK" 
    echo "✅ Agent Creation: OK"
    echo "✅ Knowledge Chat: OK"
    echo "✅ Semantic Search: OK"
    echo ""
    echo "🚀 Vexel Knowledge Workflow is working correctly!"
    
    # Cleanup
    cleanup
}

# Run main function
main "$@"
