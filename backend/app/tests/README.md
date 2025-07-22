# Vexel AI Agent Platform - Testing Suite

## 🧪 Comprehensive Testing Framework

This testing suite provides comprehensive coverage for all 5 levels of the Vexel AI Agent platform, ensuring reliability, performance, and maintainability.

## 📁 Test Structure

```
tests/
├── conftest.py                 # Global test configuration and fixtures
├── utils/
│   └── test_helpers.py        # Test utilities and helper functions
├── unit/                      # Unit tests
│   ├── level1/               # Level 1: Tools/Instructions tests
│   ├── level2/               # Level 2: Knowledge/Storage tests
│   ├── level3/               # Level 3: Memory/Reasoning tests
│   ├── level4/               # Level 4: Team Collaboration tests
│   ├── level5/               # Level 5: Agentic Workflows tests
│   └── api/                  # API unit tests
├── integration/              # Integration tests
│   ├── level1/               # Level 1 integration tests
│   ├── level2/               # Level 2 integration tests
│   ├── level3/               # Level 3 integration tests
│   ├── level4/               # Level 4 integration tests
│   ├── level5/               # Level 5 integration tests
│   └── api/                  # API integration tests
└── e2e/                      # End-to-end tests
    ├── workflows/            # Workflow testing scenarios
    └── scenarios/            # Complete user scenarios
```

## 🎯 Test Categories

### **Unit Tests**
- **Level 1**: Basic agent functionality, tools, instructions
- **Level 2**: Knowledge bases, vector storage, embeddings
- **Level 3**: Memory systems, reasoning capabilities
- **Level 4**: Team collaboration, multi-agent coordination
- **Level 5**: Agentic workflows, autonomous execution

### **Integration Tests**
- API endpoint testing
- Database integration
- External service integration
- Cross-level functionality

### **End-to-End Tests**
- Complete user workflows
- Multi-level system integration
- Performance under realistic conditions

## 🚀 Running Tests

### **Quick Start**
```bash
# Run all tests
python run_tests.py all

# Run specific level tests
python run_tests.py level1
python run_tests.py level2

# Run with coverage
python run_tests.py all --cov

# Run unit tests only
python run_tests.py unit -v
```

### **Test Commands**

| Command | Description |
|---------|-------------|
| `python run_tests.py all` | Run all tests |
| `python run_tests.py unit` | Run unit tests only |
| `python run_tests.py integration` | Run integration tests |
| `python run_tests.py e2e` | Run end-to-end tests |
| `python run_tests.py level1` | Run Level 1 tests |
| `python run_tests.py level2` | Run Level 2 tests |
| `python run_tests.py api` | Run API tests |
| `python run_tests.py performance` | Run performance tests |
| `python run_tests.py coverage` | Run with full coverage report |
| `python run_tests.py quick` | Run quick smoke tests |

### **Test Options**
- `-v, --verbose`: Verbose output
- `-x, --exitfirst`: Stop on first failure
- `--cov`: Run with coverage
- `--html`: Generate HTML report
- `--parallel`: Run tests in parallel

## 📊 Test Coverage

### **Current Status**
- **Level 1 (Tools/Instructions)**: ✅ 17/17 tests passing (100%)
- **Level 2 (Knowledge/Storage)**: ✅ 17/17 tests passing (100%)
- **Level 3 (Memory/Reasoning)**: 🚧 In development
- **Level 4 (Team Collaboration)**: 🚧 In development
- **Level 5 (Agentic Workflows)**: 🚧 In development

### **Coverage Goals**
- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: All API endpoints covered
- **Performance Tests**: <100ms API response time
- **E2E Tests**: All major user workflows

## 🔧 Test Configuration

### **Environment Variables**
```bash
TESTING=true
ENVIRONMENT=test
DATABASE_URL=sqlite:///./test.db
QDRANT_URL=http://localhost:6333
GEMINI_API_KEY=test_key
OPENAI_API_KEY=test_key
ANTHROPIC_API_KEY=test_key
```

### **Test Markers**
- `@pytest.mark.unit`: Unit tests
- `@pytest.mark.integration`: Integration tests
- `@pytest.mark.e2e`: End-to-end tests
- `@pytest.mark.api`: API tests
- `@pytest.mark.level1-5`: Level-specific tests
- `@pytest.mark.performance`: Performance tests
- `@pytest.mark.slow`: Slow-running tests

## 🛠 Test Utilities

### **Test Data Generators**
```python
from tests.utils.test_helpers import test_data

# Generate agent configuration
config = test_data.agent_config(name="TestAgent")

# Generate knowledge source
source = test_data.knowledge_source("test_kb", ["content1", "content2"])

# Generate team configuration
team = test_data.team_config("TestTeam")
```

### **Mock Managers**
```python
from tests.utils.test_helpers import mock_manager

# Mock external APIs
with mock_manager.mock_external_apis():
    # Test code here
    pass
```

### **API Test Helpers**
```python
from tests.utils.test_helpers import api_helper

# Test API endpoints
result = await api_helper.post_json(client, "/api/endpoint", data)
api_helper.assert_success_response(result)
```

## 📈 Performance Testing

### **Performance Benchmarks**
- **Agent Response Time**: <5 seconds
- **API Response Time**: <100ms
- **Knowledge Search**: <1 second
- **Workflow Execution**: <30 seconds

### **Load Testing**
- **Concurrent Users**: 20+ simultaneous requests
- **Success Rate**: 80%+ under load
- **Memory Usage**: Monitored and optimized

## 🐛 Debugging Tests

### **Common Issues**
1. **Import Errors**: Check PYTHONPATH and module structure
2. **Async Issues**: Ensure proper async/await usage
3. **Mock Failures**: Verify mock setup and external API mocking
4. **Database Issues**: Check test database configuration

### **Debug Commands**
```bash
# Run single test with debugging
python -m pytest tests/unit/level1/test_basic_agents.py::TestClass::test_method -v -s

# Run with pdb debugging
python -m pytest --pdb tests/unit/level1/

# Run with coverage and HTML report
python run_tests.py coverage --html
```

## 📝 Writing New Tests

### **Test Structure**
```python
import pytest
from tests.utils.test_helpers import test_data, mock_manager

class TestNewFeature:
    """Test new feature functionality"""
    
    def test_basic_functionality(self):
        """Test basic functionality"""
        # Arrange
        config = test_data.agent_config()
        
        # Act
        result = some_function(config)
        
        # Assert
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_async_functionality(self):
        """Test async functionality"""
        with mock_manager.mock_external_apis():
            result = await async_function()
            assert result["status"] == "success"
```

### **Best Practices**
1. **Use descriptive test names**
2. **Follow AAA pattern** (Arrange, Act, Assert)
3. **Mock external dependencies**
4. **Test both success and failure cases**
5. **Use appropriate markers**
6. **Keep tests independent**
7. **Test performance where relevant**

## 🔄 Continuous Integration

### **GitHub Actions** (Future)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: python run_tests.py all --cov
```

### **Pre-commit Hooks** (Future)
```bash
# Install pre-commit
pip install pre-commit
pre-commit install

# Run tests before commit
python run_tests.py quick
```

## 📊 Test Reports

### **HTML Reports**
```bash
python run_tests.py all --html
# Open reports/test_report.html
```

### **Coverage Reports**
```bash
python run_tests.py coverage
# Open htmlcov/index.html
```

### **JSON Reports**
```bash
python -m pytest --json-report --json-report-file=reports/test_report.json
```

## 🎯 Next Steps

1. **Complete Level 3-5 Tests**: Implement remaining test suites
2. **API Integration Tests**: Test all API endpoints
3. **Performance Optimization**: Improve test execution speed
4. **CI/CD Integration**: Set up automated testing
5. **Test Documentation**: Expand test documentation
6. **Load Testing**: Implement comprehensive load tests

---

**Happy Testing! 🧪✨**
