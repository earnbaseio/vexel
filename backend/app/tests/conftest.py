"""
Global test configuration and fixtures for Vexel AI Agent platform
"""

import os
import sys
import asyncio
import tempfile
import shutil
from pathlib import Path
from typing import Generator, AsyncGenerator, Dict, Any
from unittest.mock import Mock, AsyncMock

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app
from app.core.config import settings


# ============================================================================
# ENVIRONMENT SETUP
# ============================================================================

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment variables"""
    os.environ.update({
        "TESTING": "true",
        "ENVIRONMENT": "test",
        "DATABASE_URL": "sqlite:///./test.db",
        "QDRANT_URL": "http://localhost:6333",
        "GEMINI_API_KEY": "test_gemini_key",
        "OPENAI_API_KEY": "test_openai_key",
        "ANTHROPIC_API_KEY": "test_anthropic_key",
        "LOG_LEVEL": "INFO"
    })
    yield
    # Cleanup after all tests
    test_files = ["test.db", "test.db-shm", "test.db-wal"]
    for file in test_files:
        if os.path.exists(file):
            os.remove(file)


# ============================================================================
# TEMPORARY DIRECTORIES
# ============================================================================

@pytest.fixture
def temp_dir() -> Generator[str, None, None]:
    """Create temporary directory for tests"""
    temp_path = tempfile.mkdtemp()
    yield temp_path
    shutil.rmtree(temp_path, ignore_errors=True)


@pytest.fixture
def test_db_file(temp_dir) -> str:
    """Create temporary database file"""
    return os.path.join(temp_dir, "test_vexel.db")


# ============================================================================
# HTTP CLIENTS
# ============================================================================

@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create FastAPI test client"""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


# ============================================================================
# DATABASE FIXTURES
# ============================================================================

@pytest.fixture
def test_db_engine(test_db_file):
    """Create test database engine"""
    engine = create_engine(f"sqlite:///{test_db_file}")
    yield engine
    engine.dispose()


@pytest.fixture
def test_db_session(test_db_engine):
    """Create test database session"""
    SessionLocal = sessionmaker(bind=test_db_engine)
    session = SessionLocal()
    yield session
    session.close()


# ============================================================================
# MOCK FIXTURES
# ============================================================================

@pytest.fixture
def mock_gemini_api():
    """Mock Gemini API responses"""
    mock = Mock()
    mock.generate_content = AsyncMock(return_value=Mock(
        text="Mock Gemini response",
        content="Mock Gemini response"
    ))
    return mock


@pytest.fixture
def mock_openai_api():
    """Mock OpenAI API responses"""
    mock = Mock()
    mock.chat.completions.create = AsyncMock(return_value=Mock(
        choices=[Mock(message=Mock(content="Mock OpenAI response"))]
    ))
    return mock


@pytest.fixture
def mock_qdrant_client():
    """Mock Qdrant vector database client"""
    mock = Mock()
    mock.search = AsyncMock(return_value=[
        Mock(id=1, score=0.9, payload={"text": "Mock search result"})
    ])
    mock.upsert = AsyncMock(return_value=Mock(status="ok"))
    mock.create_collection = AsyncMock(return_value=Mock(status="ok"))
    return mock


@pytest.fixture
def mock_litellm():
    """Mock LiteLLM responses"""
    mock = Mock()
    mock.acompletion = AsyncMock(return_value=Mock(
        choices=[Mock(message=Mock(content="Mock LiteLLM response"))]
    ))
    return mock


# ============================================================================
# AGENT FIXTURES
# ============================================================================

@pytest.fixture
def sample_agent_config():
    """Sample agent configuration"""
    return {
        "name": "TestAgent",
        "model": "gemini/gemini-1.5-flash",
        "instructions": "You are a helpful test agent",
        "tools": [],
        "user_id": "test_user",
        "session_id": "test_session"
    }


@pytest.fixture
def sample_knowledge_source():
    """Sample knowledge source data"""
    return {
        "type": "text",
        "name": "test_knowledge",
        "content": [
            "This is test knowledge content.",
            "It contains multiple pieces of information.",
            "Used for testing knowledge retrieval."
        ]
    }


@pytest.fixture
def sample_team_config():
    """Sample team configuration"""
    return {
        "team_name": "TestTeam",
        "mode": "coordinate",
        "leader_model": "gemini/gemini-1.5-flash",
        "user_id": "test_user",
        "agents": {
            "researcher": {
                "name": "Research Agent",
                "role": "Expert at finding information",
                "model": "gemini/gemini-1.5-flash",
                "tools": ["duckduckgo_search"]
            },
            "analyst": {
                "name": "Analysis Agent", 
                "role": "Expert at analyzing data",
                "model": "gemini/gemini-1.5-flash",
                "tools": ["think", "analyze"]
            }
        }
    }


@pytest.fixture
def sample_workflow_config():
    """Sample workflow configuration"""
    return {
        "workflow_name": "TestWorkflow",
        "workflow_description": "Test workflow for testing",
        "user_id": "test_user",
        "steps": [
            {
                "step_id": "step1",
                "name": "First Step",
                "step_type": "agent",
                "config": {
                    "name": "TestAgent",
                    "model": "gemini/gemini-1.5-flash"
                },
                "next_steps": ["step2"]
            },
            {
                "step_id": "step2", 
                "name": "Second Step",
                "step_type": "agent",
                "config": {
                    "name": "TestAgent2",
                    "model": "gemini/gemini-1.5-flash"
                }
            }
        ]
    }


# ============================================================================
# UTILITY FIXTURES
# ============================================================================

@pytest.fixture
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_datetime():
    """Mock datetime for consistent testing"""
    from freezegun import freeze_time
    with freeze_time("2025-01-01 12:00:00"):
        yield


# ============================================================================
# PERFORMANCE FIXTURES
# ============================================================================

@pytest.fixture
def benchmark_config():
    """Configuration for performance benchmarks"""
    return {
        "min_rounds": 5,
        "max_time": 10.0,
        "warmup": True,
        "warmup_iterations": 2
    }


# ============================================================================
# CLEANUP FIXTURES
# ============================================================================

@pytest.fixture(autouse=True)
def cleanup_test_files():
    """Cleanup test files after each test"""
    yield
    # Clean up any test files created during tests
    test_patterns = [
        "tmp/test_*",
        "tmp/vexel_test_*",
        "test_*.db*",
        "*.log"
    ]
    
    import glob
    for pattern in test_patterns:
        for file in glob.glob(pattern):
            try:
                if os.path.isfile(file):
                    os.remove(file)
                elif os.path.isdir(file):
                    shutil.rmtree(file)
            except (OSError, PermissionError):
                pass  # Ignore cleanup errors


# ============================================================================
# MARKERS AND PARAMETRIZATION
# ============================================================================

def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "unit: Unit tests"
    )
    config.addinivalue_line(
        "markers", "integration: Integration tests"
    )
    config.addinivalue_line(
        "markers", "e2e: End-to-end tests"
    )
    config.addinivalue_line(
        "markers", "slow: Slow running tests"
    )
    config.addinivalue_line(
        "markers", "api: API endpoint tests"
    )
    for level in range(1, 6):
        config.addinivalue_line(
            "markers", f"level{level}: Level {level} tests"
        )


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers based on file paths"""
    for item in items:
        # Add level markers based on file path
        if "level1" in str(item.fspath):
            item.add_marker(pytest.mark.level1)
        elif "level2" in str(item.fspath):
            item.add_marker(pytest.mark.level2)
        elif "level3" in str(item.fspath):
            item.add_marker(pytest.mark.level3)
        elif "level4" in str(item.fspath):
            item.add_marker(pytest.mark.level4)
        elif "level5" in str(item.fspath):
            item.add_marker(pytest.mark.level5)
        
        # Add test type markers based on directory
        if "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        elif "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        elif "e2e" in str(item.fspath):
            item.add_marker(pytest.mark.e2e)
        
        # Add API marker for API tests
        if "api" in str(item.fspath):
            item.add_marker(pytest.mark.api)


# ============================================================================
# COMPREHENSIVE API TESTING FIXTURES
# ============================================================================

# Import comprehensive API testing infrastructure
try:
    from tests.utils.api_test_infrastructure import APITestInfrastructure, APITestScenarios
    api_test_infra = APITestInfrastructure()
    api_test_scenarios = APITestScenarios()
except ImportError:
    # Fallback if infrastructure not available
    api_test_infra = None
    api_test_scenarios = None


@pytest.fixture
async def authenticated_client(async_client):
    """Async client with authentication headers"""
    if api_test_infra:
        headers = await api_test_infra.authenticate_user(async_client)
        async_client.headers.update(headers)
    else:
        # Fallback mock headers
        async_client.headers.update({"Authorization": "Bearer mock_token"})
    return async_client


@pytest.fixture
async def admin_client(async_client):
    """Async client with admin authentication headers"""
    if api_test_infra:
        headers = await api_test_infra.authenticate_admin(async_client)
        async_client.headers.update(headers)
    else:
        # Fallback mock headers
        async_client.headers.update({"Authorization": "Bearer mock_admin_token"})
    return async_client


@pytest.fixture
def sample_agent_data_with_ai():
    """Sample agent data with AI fields"""
    if api_test_infra:
        return api_test_infra.create_sample_agent_data()
    else:
        return {
            "name": "Test Agent",
            "description": "Test agent",
            "ai_model_provider": "openai",
            "ai_model_id": "gpt-4",
            "ai_model_parameters": {"temperature": 0.7}
        }


@pytest.fixture
def sample_conversation_data_fixture():
    """Sample conversation data"""
    if api_test_infra:
        return api_test_infra.create_sample_conversation_data()
    else:
        return {
            "title": "Test Conversation",
            "description": "Test conversation",
            "agent_id": "test_agent"
        }


@pytest.fixture
def sample_message_data_fixture():
    """Sample message data"""
    if api_test_infra:
        return api_test_infra.create_sample_message_data()
    else:
        return {
            "content": "Test message",
            "role": "user"
        }


@pytest.fixture
def sample_workflow_data_with_ai():
    """Sample workflow data with AI configuration"""
    if api_test_infra:
        return api_test_infra.create_sample_workflow_data()
    else:
        return {
            "name": "Test Workflow",
            "description": "Test workflow",
            "steps": [{
                "step_id": "step1",
                "name": "Test Step",
                "step_type": "agent",
                "config": {
                    "ai_model_provider": "openai",
                    "ai_model_id": "gpt-4"
                }
            }]
        }


@pytest.fixture
def crud_test_scenarios():
    """CRUD test scenarios"""
    if api_test_scenarios:
        return api_test_scenarios.get_crud_test_scenarios()
    else:
        return [
            {"name": "create_valid", "expected_status": 201},
            {"name": "read_existing", "expected_status": 200},
            {"name": "update_existing", "expected_status": 200},
            {"name": "delete_existing", "expected_status": 200}
        ]


@pytest.fixture
def auth_test_scenarios():
    """Authentication test scenarios"""
    if api_test_scenarios:
        return api_test_scenarios.get_auth_test_scenarios()
    else:
        return [
            {"name": "valid_credentials", "expected_status": 200},
            {"name": "invalid_credentials", "expected_status": 401}
        ]


@pytest.fixture
def api_test_infrastructure():
    """Comprehensive API test infrastructure fixture"""
    return api_test_infra if api_test_infra else Mock()
