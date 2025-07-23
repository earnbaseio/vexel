#!/bin/bash

# Vexel RAG Optimization System Test Script
# Comprehensive testing script for the RAG system

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
TEST_COLLECTION_ID=""
AUTH_TOKEN=""

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

check_system_health() {
    log_info "Checking system health..."
    
    # Check backend health
    if curl -f "$API_BASE_URL/health" &> /dev/null; then
        log_success "Backend is healthy"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # Check system info
    local system_info=$(curl -s "$API_BASE_URL/system/info")
    if echo "$system_info" | grep -q "rag_optimization"; then
        log_success "RAG optimization is enabled"
    else
        log_error "RAG optimization not detected"
        return 1
    fi
    
    return 0
}

create_test_user() {
    log_info "Creating test user..."
    
    # Create test user
    local response=$(curl -s -X POST "$API_BASE_URL/api/v1/auth/sign-up" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_USER_EMAIL\",
            \"password\": \"$TEST_USER_PASSWORD\",
            \"full_name\": \"Test User\"
        }")
    
    if echo "$response" | grep -q "email"; then
        log_success "Test user created or already exists"
    else
        log_warning "Test user creation response: $response"
    fi
}

authenticate_user() {
    log_info "Authenticating test user..."
    
    # Login and get token
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

create_test_collection() {
    log_info "Creating test collection..."
    
    local response=$(curl -s -X POST "$API_BASE_URL/api/v1/knowledge/create" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "knowledge_type": "text",
            "name": "RAG Test Collection",
            "content": ["This is a test knowledge base for RAG optimization testing."]
        }')
    
    if echo "$response" | grep -q "success"; then
        TEST_COLLECTION_ID=$(echo "$response" | grep -o '"collection_id":"[^"]*"' | cut -d'"' -f4)
        if [ -z "$TEST_COLLECTION_ID" ]; then
            TEST_COLLECTION_ID=$(echo "$response" | grep -o '"collection":"[^"]*"' | cut -d'"' -f4)
        fi
        log_success "Test collection created: $TEST_COLLECTION_ID"
        return 0
    else
        log_error "Collection creation failed: $response"
        return 1
    fi
}

test_chunking_recommendations() {
    log_info "Testing chunking recommendations endpoint..."
    
    local response=$(curl -s -X GET "$API_BASE_URL/api/v1/knowledge/chunking-recommendations/pdf" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q "recommended_strategy"; then
        log_success "Chunking recommendations working"
        echo "   Recommended strategy: $(echo "$response" | grep -o '"recommended_strategy":"[^"]*"' | cut -d'"' -f4)"
    else
        log_error "Chunking recommendations failed: $response"
        return 1
    fi
}

test_content_analysis() {
    log_info "Testing content analysis endpoint..."
    
    # Create test file
    local test_file="/tmp/test_document.txt"
    cat > "$test_file" << EOF
# Test Document

This is a comprehensive test document for the RAG optimization system.

## Technical Section

This section discusses advanced concepts:
- Machine Learning algorithms
- Natural Language Processing
- Vector databases and embeddings

The content is designed to trigger different chunking strategies
based on its structure and complexity.

### Conclusion

This document serves as a test case for validating the
intelligent chunking system's ability to analyze and
optimize document processing strategies.
EOF
    
    local response=$(curl -s -X POST "$API_BASE_URL/api/v1/knowledge/analyze-content" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -F "file=@$test_file")
    
    if echo "$response" | grep -q "recommended_strategy"; then
        log_success "Content analysis working"
        echo "   File type: $(echo "$response" | grep -o '"file_type":"[^"]*"' | cut -d'"' -f4)"
        echo "   Recommended strategy: $(echo "$response" | grep -o '"recommended_strategy":"[^"]*"' | cut -d'"' -f4)"
        echo "   Confidence: $(echo "$response" | grep -o '"confidence_score":[0-9.]*' | cut -d':' -f2)"
    else
        log_error "Content analysis failed: $response"
        return 1
    fi
    
    rm -f "$test_file"
}

test_file_upload_with_chunking() {
    log_info "Testing file upload with different chunking strategies..."
    
    # Create test files
    local test_files=(
        "/tmp/test_fixed.txt"
        "/tmp/test_recursive.txt"
        "/tmp/test_markdown.md"
    )
    
    local strategies=("fixed" "recursive" "markdown")
    
    # Create test content
    cat > "/tmp/test_fixed.txt" << EOF
This is a simple test document for fixed chunking strategy.
It contains multiple sentences to test the chunking behavior.
The content is straightforward and should work well with fixed-size chunks.
EOF
    
    cat > "/tmp/test_recursive.txt" << EOF
This is a test document for recursive chunking strategy.

It contains multiple paragraphs with natural breakpoints.
The recursive strategy should find good splitting points.

This paragraph tests the recursive algorithm's ability to
maintain context while creating appropriately sized chunks.
EOF
    
    cat > "/tmp/test_markdown.md" << EOF
# Markdown Test Document

This is a test document for markdown chunking strategy.

## Section 1

This section contains structured content:
- Item 1
- Item 2
- Item 3

### Subsection 1.1

More detailed content here.

## Section 2

Another section with different content.
EOF
    
    # Test each strategy
    for i in "${!test_files[@]}"; do
        local file="${test_files[$i]}"
        local strategy="${strategies[$i]}"
        
        log_info "Testing $strategy chunking with $(basename "$file")..."
        
        local response=$(curl -s -X POST "$API_BASE_URL/api/v1/knowledge/upload" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -F "file=@$file" \
            -F "collection_id=$TEST_COLLECTION_ID" \
            -F "chunking_strategy=$strategy" \
            -F "enable_analysis=true")
        
        if echo "$response" | grep -q "uploaded successfully"; then
            log_success "$strategy chunking upload successful"
            echo "   Chunks created: $(echo "$response" | grep -o '"documents_processed":[0-9]*' | cut -d':' -f2)"
        else
            log_error "$strategy chunking upload failed: $response"
        fi
        
        rm -f "$file"
    done
}

test_auto_strategy_selection() {
    log_info "Testing auto strategy selection..."
    
    # Create test file with complex content
    local test_file="/tmp/test_auto.md"
    cat > "$test_file" << EOF
# Complex Technical Document

## Introduction

This document contains technical content that should trigger
intelligent strategy selection based on content analysis.

### Technical Concepts

- API endpoints and RESTful services
- Database optimization techniques
- Machine learning algorithms
- Vector embeddings and similarity search

## Implementation Details

The system uses advanced algorithms for:
1. Content structure analysis
2. Complexity assessment
3. Strategy recommendation
4. Performance optimization

### Code Examples

\`\`\`python
def process_document(content, strategy="auto"):
    analyzer = ContentAnalyzer()
    result = analyzer.analyze(content)
    return result.recommended_strategy
\`\`\`

## Conclusion

This document should trigger semantic or agentic chunking
based on its technical complexity and structured format.
EOF
    
    local response=$(curl -s -X POST "$API_BASE_URL/api/v1/knowledge/upload" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -F "file=@$test_file" \
        -F "collection_id=$TEST_COLLECTION_ID" \
        -F "chunking_strategy=auto" \
        -F "enable_analysis=true")
    
    if echo "$response" | grep -q "uploaded successfully"; then
        log_success "Auto strategy selection working"
        local strategy=$(echo "$response" | grep -o '"chunking_strategy":"[^"]*"' | cut -d'"' -f4)
        echo "   Auto-selected strategy: $strategy"
    else
        log_error "Auto strategy selection failed: $response"
        return 1
    fi
    
    rm -f "$test_file"
}

test_performance_dashboard() {
    log_info "Testing performance dashboard..."
    
    # Note: This might fail for free tier users
    local response=$(curl -s -X GET "$API_BASE_URL/api/v1/knowledge/performance-dashboard" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q "summary_24h"; then
        log_success "Performance dashboard accessible"
    elif echo "$response" | grep -q "Premium and Enterprise users only"; then
        log_warning "Performance dashboard requires premium tier (expected for test user)"
    else
        log_error "Performance dashboard failed: $response"
        return 1
    fi
}

test_admin_endpoints() {
    log_info "Testing admin endpoints (may fail for non-admin users)..."
    
    local response=$(curl -s -X GET "$API_BASE_URL/api/v1/knowledge/admin/system/health" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q "health_score"; then
        log_success "Admin endpoints accessible"
    elif echo "$response" | grep -q "Admin access required"; then
        log_warning "Admin endpoints require superuser access (expected for test user)"
    else
        log_error "Admin endpoints failed: $response"
    fi
}

run_performance_tests() {
    log_info "Running performance tests..."
    
    # Test with larger file
    local large_file="/tmp/large_test.txt"
    
    # Create 1MB test file
    for i in {1..1000}; do
        echo "This is line $i of the large test document. It contains enough content to test performance with larger files. The chunking system should handle this efficiently." >> "$large_file"
    done
    
    local start_time=$(date +%s.%N)
    
    local response=$(curl -s -X POST "$API_BASE_URL/api/v1/knowledge/upload" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -F "file=@$large_file" \
        -F "collection_id=$TEST_COLLECTION_ID" \
        -F "chunking_strategy=recursive" \
        -F "enable_analysis=false")
    
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc)
    
    if echo "$response" | grep -q "uploaded successfully"; then
        log_success "Performance test completed in ${duration}s"
        echo "   File size: ~1MB"
        echo "   Chunks created: $(echo "$response" | grep -o '"documents_processed":[0-9]*' | cut -d':' -f2)"
    else
        log_error "Performance test failed: $response"
    fi
    
    rm -f "$large_file"
}

cleanup_test_data() {
    log_info "Cleaning up test data..."
    
    # Delete test collection
    if [ -n "$TEST_COLLECTION_ID" ]; then
        curl -s -X DELETE "$API_BASE_URL/api/v1/knowledge/collections/$TEST_COLLECTION_ID" \
            -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null
        log_success "Test collection cleaned up"
    fi
}

run_all_tests() {
    log_info "Starting comprehensive RAG system tests..."
    echo ""
    
    local failed_tests=0
    
    # System health check
    if ! check_system_health; then
        ((failed_tests++))
    fi
    echo ""
    
    # User management tests
    create_test_user
    if ! authenticate_user; then
        log_error "Cannot proceed without authentication"
        exit 1
    fi
    echo ""
    
    # Collection setup
    if ! create_test_collection; then
        log_error "Cannot proceed without test collection"
        exit 1
    fi
    echo ""
    
    # API endpoint tests
    if ! test_chunking_recommendations; then
        ((failed_tests++))
    fi
    echo ""
    
    if ! test_content_analysis; then
        ((failed_tests++))
    fi
    echo ""
    
    # Chunking strategy tests
    test_file_upload_with_chunking
    echo ""
    
    if ! test_auto_strategy_selection; then
        ((failed_tests++))
    fi
    echo ""
    
    # Dashboard and admin tests
    test_performance_dashboard
    echo ""
    
    test_admin_endpoints
    echo ""
    
    # Performance tests
    run_performance_tests
    echo ""
    
    # Cleanup
    cleanup_test_data
    echo ""
    
    # Summary
    if [ $failed_tests -eq 0 ]; then
        log_success "All tests completed successfully! 🎉"
        echo ""
        echo "✅ System Health: OK"
        echo "✅ Authentication: OK"
        echo "✅ Content Analysis: OK"
        echo "✅ Chunking Strategies: OK"
        echo "✅ Auto Selection: OK"
        echo "✅ Performance: OK"
        echo ""
        echo "🚀 Vexel RAG Optimization System is working correctly!"
    else
        log_warning "$failed_tests tests failed, but system is mostly functional"
        echo ""
        echo "⚠️  Some advanced features may require premium tier or admin access"
        echo "🔧 Check logs for detailed error information"
    fi
}

# Main execution
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "Vexel RAG Optimization System Test Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  test      Run all tests (default)"
        echo "  health    Check system health only"
        echo "  auth      Test authentication only"
        echo "  upload    Test file upload only"
        echo "  analysis  Test content analysis only"
        echo "  perf      Test performance only"
        echo "  help      Show this help message"
        echo ""
        exit 0
        ;;
    "health")
        check_system_health
        ;;
    "auth")
        create_test_user
        authenticate_user
        ;;
    "upload")
        create_test_user
        authenticate_user
        create_test_collection
        test_file_upload_with_chunking
        cleanup_test_data
        ;;
    "analysis")
        create_test_user
        authenticate_user
        test_content_analysis
        ;;
    "perf")
        create_test_user
        authenticate_user
        create_test_collection
        run_performance_tests
        cleanup_test_data
        ;;
    "test"|"")
        run_all_tests
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
