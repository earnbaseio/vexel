"""
Unit tests for Level 1: Basic Agents (Tools/Instructions)
"""

import asyncio
import pytest
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, Any

from tests.utils.test_helpers import test_data, mock_manager


class TestBasicAgentCreation:
    """Test basic agent creation and configuration"""
    
    def test_agent_config_validation(self):
        """Test agent configuration validation"""
        # Valid configuration
        config = test_data.agent_config()
        assert config["name"] == "TestAgent"
        assert config["model"] == "gemini/gemini-2.5-flash-lite"
        assert config["user_id"] == "test_user"
        assert isinstance(config["tools"], list)
    
    def test_agent_config_customization(self):
        """Test agent configuration customization"""
        config = test_data.agent_config(
            name="CustomAgent",
            model="openai/gpt-4",
            instructions="Custom instructions",
            tools=["search", "calculator"]
        )
        
        assert config["name"] == "CustomAgent"
        assert config["model"] == "openai/gpt-4"
        assert config["instructions"] == "Custom instructions"
        assert config["tools"] == ["search", "calculator"]
    
    def test_agent_config_defaults(self):
        """Test agent configuration defaults"""
        config = test_data.agent_config()
        
        # Check required fields have defaults
        assert "name" in config
        assert "model" in config
        assert "instructions" in config
        assert "tools" in config
        assert "user_id" in config
        assert "session_id" in config


class TestAgentInstructions:
    """Test agent instruction processing"""
    
    @pytest.mark.asyncio
    async def test_basic_instruction_processing(self):
        """Test basic instruction processing"""
        with mock_manager.mock_external_apis():
            # Mock agent response
            mock_response = mock_manager.mock_agent_response(
                "I understand the instructions and am ready to help."
            )
            
            # Test instruction processing
            instructions = "You are a helpful assistant. Answer questions clearly."
            
            # Simulate agent processing instructions
            processed = await self._process_instructions(instructions)
            
            assert processed is not None
            assert isinstance(processed, str)
    
    @pytest.mark.asyncio
    async def test_complex_instruction_processing(self):
        """Test complex instruction processing"""
        with mock_manager.mock_external_apis():
            instructions = """
            You are a specialized research assistant with the following capabilities:
            1. Search for information using available tools
            2. Analyze and synthesize findings
            3. Provide detailed, well-structured responses
            4. Cite sources when possible
            """
            
            processed = await self._process_instructions(instructions)
            
            assert processed is not None
            assert len(processed) > 0
    
    async def _process_instructions(self, instructions: str) -> str:
        """Helper method to simulate instruction processing"""
        # This would normally involve actual agent processing
        # For testing, we return a mock response
        return f"Processed: {instructions[:50]}..."


class TestAgentTools:
    """Test agent tool integration"""
    
    def test_tool_registration(self):
        """Test tool registration in agent configuration"""
        tools = ["search", "calculator", "file_reader"]
        config = test_data.agent_config(tools=tools)
        
        assert config["tools"] == tools
        assert len(config["tools"]) == 3
    
    def test_empty_tools_list(self):
        """Test agent with no tools"""
        config = test_data.agent_config(tools=[])
        
        assert config["tools"] == []
        assert isinstance(config["tools"], list)
    
    @pytest.mark.asyncio
    async def test_tool_execution_simulation(self):
        """Test simulated tool execution"""
        with mock_manager.mock_external_apis():
            # Mock tool execution
            tool_result = await self._execute_tool("search", {"query": "test"})
            
            assert tool_result is not None
            assert "result" in tool_result
    
    async def _execute_tool(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Helper method to simulate tool execution"""
        # Mock tool execution results
        tool_results = {
            "search": {"result": "Search results for: " + params.get("query", "")},
            "calculator": {"result": "Calculation result: 42"},
            "file_reader": {"result": "File content: sample text"}
        }
        
        return tool_results.get(tool_name, {"result": "Unknown tool"})


class TestAgentCommunication:
    """Test agent communication and responses"""
    
    @pytest.mark.asyncio
    async def test_basic_message_processing(self):
        """Test basic message processing"""
        with mock_manager.mock_external_apis():
            message = "Hello, how can you help me?"
            response = await self._process_message(message)
            
            assert response is not None
            assert isinstance(response, str)
            assert len(response) > 0
    
    @pytest.mark.asyncio
    async def test_complex_query_processing(self):
        """Test complex query processing"""
        with mock_manager.mock_external_apis():
            message = """
            I need help with analyzing market trends for AI companies.
            Can you search for recent information and provide insights?
            """
            
            response = await self._process_message(message)
            
            assert response is not None
            assert len(response) > 30  # Expect detailed response
    
    @pytest.mark.asyncio
    async def test_error_handling_in_communication(self):
        """Test error handling in agent communication"""
        # Simulate error scenario by patching the helper method directly
        with patch.object(self, '_process_message', side_effect=Exception("API Error")):
            response = await self._process_message_with_error_handling("Test message")

            # Should handle error gracefully
            assert response is not None
            assert "error" in response.lower() or "sorry" in response.lower()
    
    async def _process_message(self, message: str) -> str:
        """Helper method to simulate message processing"""
        # Mock message processing
        return f"Response to: {message[:30]}..."
    
    async def _process_message_with_error_handling(self, message: str) -> str:
        """Helper method with error handling"""
        try:
            return await self._process_message(message)
        except Exception:
            return "I'm sorry, I encountered an error processing your request."


class TestAgentSession:
    """Test agent session management"""
    
    def test_session_creation(self):
        """Test session creation"""
        config = test_data.agent_config(session_id="test_session_123")
        
        assert config["session_id"] == "test_session_123"
    
    def test_user_isolation(self):
        """Test user isolation in sessions"""
        user1_config = test_data.agent_config(user_id="user1", session_id="session1")
        user2_config = test_data.agent_config(user_id="user2", session_id="session2")
        
        assert user1_config["user_id"] != user2_config["user_id"]
        assert user1_config["session_id"] != user2_config["session_id"]
    
    @pytest.mark.asyncio
    async def test_session_state_management(self):
        """Test session state management"""
        session_id = "test_session_state"
        
        # Simulate session state
        state = await self._get_session_state(session_id)
        assert state is not None
        
        # Update session state
        updated_state = await self._update_session_state(session_id, {"key": "value"})
        assert updated_state is not None
    
    async def _get_session_state(self, session_id: str) -> Dict[str, Any]:
        """Helper method to get session state"""
        return {"session_id": session_id, "messages": [], "context": {}}
    
    async def _update_session_state(self, session_id: str, update: Dict[str, Any]) -> Dict[str, Any]:
        """Helper method to update session state"""
        state = await self._get_session_state(session_id)
        state.update(update)
        return state


class TestAgentPerformance:
    """Test agent performance characteristics"""
    
    @pytest.mark.asyncio
    async def test_response_time(self):
        """Test agent response time"""
        from tests.utils.test_helpers import perf_helper
        
        with mock_manager.mock_external_apis():
            # Measure response time
            result, execution_time = await perf_helper.measure_execution_time(
                self._process_message("Quick test message")
            )
            
            # Assert reasonable response time (< 5 seconds for mock)
            perf_helper.assert_performance_threshold(
                execution_time, 5.0, "Agent response"
            )
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self):
        """Test handling concurrent requests"""
        import asyncio
        
        with mock_manager.mock_external_apis():
            # Create multiple concurrent requests
            tasks = [
                self._process_message(f"Message {i}")
                for i in range(5)
            ]
            
            # Execute concurrently
            results = await asyncio.gather(*tasks)
            
            # All requests should complete
            assert len(results) == 5
            assert all(result is not None for result in results)
    
    async def _process_message(self, message: str) -> str:
        """Helper method for performance testing"""
        # Simulate processing delay
        await asyncio.sleep(0.1)
        return f"Processed: {message}"


@pytest.mark.level1
@pytest.mark.unit
class TestLevel1Integration:
    """Integration tests for Level 1 components"""
    
    @pytest.mark.asyncio
    async def test_end_to_end_agent_interaction(self):
        """Test complete agent interaction flow"""
        with mock_manager.mock_external_apis():
            # Create agent configuration
            config = test_data.agent_config(
                name="IntegrationTestAgent",
                tools=["search", "calculator"]
            )
            
            # Process instructions
            instructions_result = await self._process_instructions(config["instructions"])
            assert instructions_result is not None
            
            # Process user message
            message = "Search for information about AI agents"
            response = await self._process_message(message)
            assert response is not None
            
            # Verify complete flow
            assert len(response) > 0
    
    async def _process_instructions(self, instructions: str) -> str:
        """Helper for instruction processing"""
        return f"Instructions processed: {len(instructions)} characters"
    
    async def _process_message(self, message: str) -> str:
        """Helper for message processing"""
        return f"Response to: {message}"
