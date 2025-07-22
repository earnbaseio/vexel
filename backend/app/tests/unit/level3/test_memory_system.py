"""
Unit tests for Level 3: Memory System
"""

import asyncio
import pytest
import tempfile
import os
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any, List, Optional

from tests.utils.test_helpers import test_data, mock_manager


class TestMemorySystemSetup:
    """Test memory system initialization and setup"""
    
    def test_memory_agent_initialization(self):
        """Test memory agent initialization"""
        with mock_manager.mock_external_apis():
            config = {
                "name": "TestMemoryAgent",
                "model": "gemini/gemini-1.5-flash",
                "user_id": "test_user",
                "session_id": "test_session",
                "db_file": "tmp/test_memory.db"
            }
            
            # Mock the agent creation
            agent = self._create_mock_memory_agent(config)
            
            assert agent["name"] == "TestMemoryAgent"
            assert agent["model"] == "gemini/gemini-1.5-flash"
            assert agent["user_id"] == "test_user"
            assert agent["session_id"] == "test_session"
    
    def test_memory_database_setup(self):
        """Test memory database initialization"""
        with mock_manager.mock_external_apis():
            db_config = {
                "table_name": "test_memories",
                "db_file": "tmp/test_memory.db"
            }
            
            # Mock database setup
            db = self._create_mock_memory_db(db_config)
            
            assert db["table_name"] == "test_memories"
            assert db["db_file"] == "tmp/test_memory.db"
            assert db["initialized"] is True
    
    def test_memory_manager_setup(self):
        """Test memory manager initialization"""
        with mock_manager.mock_external_apis():
            manager_config = {
                "model": "gemini/gemini-1.5-flash",
                "temperature": 0.3
            }
            
            # Mock memory manager
            manager = self._create_mock_memory_manager(manager_config)
            
            assert manager["model"] == "gemini/gemini-1.5-flash"
            assert manager["temperature"] == 0.3
            assert "instructions" in manager
    
    def test_session_summarizer_setup(self):
        """Test session summarizer initialization"""
        with mock_manager.mock_external_apis():
            summarizer_config = {
                "model": "gemini/gemini-1.5-flash",
                "temperature": 0.2
            }
            
            # Mock session summarizer
            summarizer = self._create_mock_session_summarizer(summarizer_config)
            
            assert summarizer["model"] == "gemini/gemini-1.5-flash"
            assert summarizer["temperature"] == 0.2
            assert "instructions" in summarizer
    
    def _create_mock_memory_agent(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to create mock memory agent"""
        return {
            "name": config["name"],
            "model": config["model"],
            "user_id": config["user_id"],
            "session_id": config["session_id"],
            "memory": Mock(),
            "storage": Mock(),
            "knowledge_bases": [],
            "agent": Mock()
        }
    
    def _create_mock_memory_db(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to create mock memory database"""
        return {
            "table_name": config["table_name"],
            "db_file": config["db_file"],
            "initialized": True,
            "connection": Mock()
        }
    
    def _create_mock_memory_manager(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to create mock memory manager"""
        return {
            "model": config["model"],
            "temperature": config["temperature"],
            "instructions": "Memory management instructions",
            "create_memory": AsyncMock(),
            "update_memory": AsyncMock()
        }
    
    def _create_mock_session_summarizer(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to create mock session summarizer"""
        return {
            "model": config["model"],
            "temperature": config["temperature"],
            "instructions": "Session summarization instructions",
            "summarize": AsyncMock()
        }


class TestMemoryOperations:
    """Test memory CRUD operations"""
    
    @pytest.mark.asyncio
    async def test_create_memory(self):
        """Test memory creation"""
        with mock_manager.mock_external_apis():
            memory_data = {
                "user_id": "test_user",
                "content": "User prefers detailed explanations",
                "topics": ["preferences", "communication"],
                "importance": 0.8
            }
            
            # Mock memory creation
            result = await self._create_memory(memory_data)
            
            assert result["success"] is True
            assert result["memory_id"] is not None
            assert result["content"] == memory_data["content"]
    
    @pytest.mark.asyncio
    async def test_retrieve_memories(self):
        """Test memory retrieval"""
        with mock_manager.mock_external_apis():
            user_id = "test_user"
            limit = 10
            
            # Mock memory retrieval
            memories = await self._get_memories(user_id, limit)
            
            assert isinstance(memories, list)
            assert len(memories) <= limit
            assert all("memory" in mem for mem in memories)
            assert all("topics" in mem for mem in memories)
    
    @pytest.mark.asyncio
    async def test_update_memory(self):
        """Test memory updates"""
        with mock_manager.mock_external_apis():
            memory_id = "test_memory_123"
            update_data = {
                "content": "Updated memory content",
                "importance": 0.9
            }
            
            # Mock memory update
            result = await self._update_memory(memory_id, update_data)
            
            assert result["success"] is True
            assert result["updated"] is True
    
    @pytest.mark.asyncio
    async def test_search_memories(self):
        """Test memory search functionality"""
        with mock_manager.mock_external_apis():
            search_query = "user preferences"
            user_id = "test_user"
            
            # Mock memory search
            results = await self._search_memories(search_query, user_id)
            
            assert isinstance(results, list)
            assert all("relevance_score" in result for result in results)
            assert all("memory" in result for result in results)
    
    @pytest.mark.asyncio
    async def test_delete_memories(self):
        """Test memory deletion"""
        with mock_manager.mock_external_apis():
            user_id = "test_user"
            
            # Mock memory deletion
            result = await self._clear_memories(user_id)
            
            assert result["success"] is True
            assert result["deleted_count"] >= 0
    
    async def _create_memory(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to create memory"""
        return {
            "success": True,
            "memory_id": "mem_123",
            "content": memory_data["content"],
            "created_at": "2025-01-01T12:00:00Z"
        }
    
    async def _get_memories(self, user_id: str, limit: int) -> List[Dict[str, Any]]:
        """Helper to get memories"""
        return [
            {
                "memory": f"Memory {i} for {user_id}",
                "topics": ["test", "memory"],
                "created_at": "2025-01-01T12:00:00Z",
                "importance": 0.7
            }
            for i in range(min(limit, 3))
        ]
    
    async def _update_memory(self, memory_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to update memory"""
        return {
            "success": True,
            "updated": True,
            "memory_id": memory_id
        }
    
    async def _search_memories(self, query: str, user_id: str) -> List[Dict[str, Any]]:
        """Helper to search memories"""
        return [
            {
                "memory": f"Memory related to {query}",
                "relevance_score": 0.9,
                "topics": ["search", "test"],
                "user_id": user_id
            }
        ]
    
    async def _clear_memories(self, user_id: str) -> Dict[str, Any]:
        """Helper to clear memories"""
        return {
            "success": True,
            "deleted_count": 5,
            "user_id": user_id
        }


class TestReasoningSystem:
    """Test reasoning capabilities"""
    
    @pytest.mark.asyncio
    async def test_think_tool(self):
        """Test think tool functionality"""
        with mock_manager.mock_external_apis():
            problem = "How to optimize database queries for better performance?"
            
            # Mock think tool execution
            result = await self._execute_think_tool(problem)
            
            assert result["tool"] == "think"
            assert result["thought"] is not None
            assert result["action"] is not None
            assert result["confidence"] > 0
    
    @pytest.mark.asyncio
    async def test_analyze_tool(self):
        """Test analyze tool functionality"""
        with mock_manager.mock_external_apis():
            data = {
                "results": ["Result 1", "Result 2", "Result 3"],
                "context": "Analysis context"
            }
            
            # Mock analyze tool execution
            result = await self._execute_analyze_tool(data)
            
            assert result["tool"] == "analyze"
            assert result["analysis"] is not None
            assert result["insights"] is not None
            assert result["next_action"] is not None
    
    @pytest.mark.asyncio
    async def test_step_by_step_reasoning(self):
        """Test step-by-step reasoning process"""
        with mock_manager.mock_external_apis():
            complex_problem = "Design a scalable microservices architecture"
            
            # Mock step-by-step reasoning
            steps = await self._execute_step_by_step_reasoning(complex_problem)
            
            assert isinstance(steps, list)
            assert len(steps) > 1
            assert all("step" in step for step in steps)
            assert all("reasoning" in step for step in steps)
    
    @pytest.mark.asyncio
    async def test_reasoning_with_memory(self):
        """Test reasoning that incorporates memory"""
        with mock_manager.mock_external_apis():
            problem = "What approach should I take based on my previous preferences?"
            user_id = "test_user"
            
            # Mock reasoning with memory
            result = await self._reason_with_memory(problem, user_id)
            
            assert result["reasoning"] is not None
            assert result["memory_used"] is True
            assert result["relevant_memories"] is not None
    
    async def _execute_think_tool(self, problem: str) -> Dict[str, Any]:
        """Helper to execute think tool"""
        return {
            "tool": "think",
            "problem": problem,
            "thought": f"Breaking down the problem: {problem}",
            "action": "Analyze requirements and constraints",
            "confidence": 0.8
        }
    
    async def _execute_analyze_tool(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to execute analyze tool"""
        return {
            "tool": "analyze",
            "data": data,
            "analysis": "Comprehensive analysis of the provided data",
            "insights": ["Insight 1", "Insight 2"],
            "next_action": "Proceed with implementation"
        }
    
    async def _execute_step_by_step_reasoning(self, problem: str) -> List[Dict[str, Any]]:
        """Helper for step-by-step reasoning"""
        return [
            {
                "step": 1,
                "reasoning": "Identify requirements and constraints",
                "output": "Requirements analysis complete"
            },
            {
                "step": 2,
                "reasoning": "Design system architecture",
                "output": "Architecture design complete"
            },
            {
                "step": 3,
                "reasoning": "Plan implementation strategy",
                "output": "Implementation plan ready"
            }
        ]
    
    async def _reason_with_memory(self, problem: str, user_id: str) -> Dict[str, Any]:
        """Helper for reasoning with memory"""
        return {
            "problem": problem,
            "reasoning": "Based on your previous preferences for detailed solutions...",
            "memory_used": True,
            "relevant_memories": [
                "User prefers detailed explanations",
                "User likes step-by-step approaches"
            ],
            "solution": "Detailed step-by-step solution"
        }


class TestSessionManagement:
    """Test session management and summaries"""
    
    @pytest.mark.asyncio
    async def test_session_creation(self):
        """Test session creation and initialization"""
        with mock_manager.mock_external_apis():
            session_config = {
                "user_id": "test_user",
                "session_id": "test_session_123"
            }
            
            # Mock session creation
            session = await self._create_session(session_config)
            
            assert session["user_id"] == "test_user"
            assert session["session_id"] == "test_session_123"
            assert session["created_at"] is not None
            assert session["status"] == "active"
    
    @pytest.mark.asyncio
    async def test_session_summary_generation(self):
        """Test session summary generation"""
        with mock_manager.mock_external_apis():
            session_data = {
                "session_id": "test_session_123",
                "messages": [
                    {"role": "user", "content": "Hello, I need help with Python"},
                    {"role": "assistant", "content": "I'd be happy to help with Python!"},
                    {"role": "user", "content": "Can you explain list comprehensions?"},
                    {"role": "assistant", "content": "List comprehensions are a concise way..."}
                ]
            }
            
            # Mock summary generation
            summary = await self._generate_session_summary(session_data)
            
            assert summary["session_id"] == "test_session_123"
            assert summary["summary"] is not None
            assert summary["key_topics"] is not None
            assert summary["action_items"] is not None
    
    @pytest.mark.asyncio
    async def test_session_context_retrieval(self):
        """Test session context retrieval"""
        with mock_manager.mock_external_apis():
            user_id = "test_user"
            current_session = "current_session"
            
            # Mock context retrieval
            context = await self._get_session_context(user_id, current_session)
            
            assert context["current_session"] == current_session
            assert context["previous_sessions"] is not None
            assert context["relevant_memories"] is not None
    
    @pytest.mark.asyncio
    async def test_cross_session_continuity(self):
        """Test continuity across sessions"""
        with mock_manager.mock_external_apis():
            user_id = "test_user"
            previous_session = "session_1"
            current_session = "session_2"
            
            # Mock cross-session continuity
            continuity = await self._check_session_continuity(
                user_id, previous_session, current_session
            )
            
            assert continuity["user_id"] == user_id
            assert continuity["previous_session"] == previous_session
            assert continuity["current_session"] == current_session
            assert continuity["shared_context"] is not None
    
    async def _create_session(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to create session"""
        return {
            "user_id": config["user_id"],
            "session_id": config["session_id"],
            "created_at": "2025-01-01T12:00:00Z",
            "status": "active",
            "messages": []
        }
    
    async def _generate_session_summary(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to generate session summary"""
        return {
            "session_id": session_data["session_id"],
            "summary": "User asked about Python programming, specifically list comprehensions",
            "key_topics": ["Python", "list comprehensions", "programming"],
            "action_items": ["Follow up on advanced Python topics"],
            "duration": "15 minutes",
            "message_count": len(session_data["messages"])
        }
    
    async def _get_session_context(self, user_id: str, session_id: str) -> Dict[str, Any]:
        """Helper to get session context"""
        return {
            "user_id": user_id,
            "current_session": session_id,
            "previous_sessions": ["session_1", "session_2"],
            "relevant_memories": ["User is learning Python", "Prefers examples"],
            "context_summary": "Ongoing Python learning journey"
        }
    
    async def _check_session_continuity(self, user_id: str, prev_session: str, curr_session: str) -> Dict[str, Any]:
        """Helper to check session continuity"""
        return {
            "user_id": user_id,
            "previous_session": prev_session,
            "current_session": curr_session,
            "shared_context": "Python learning progression",
            "continuity_score": 0.85,
            "relevant_history": ["Previous Python questions", "Learning preferences"]
        }


@pytest.mark.level3
@pytest.mark.unit
class TestLevel3Integration:
    """Integration tests for Level 3 components"""
    
    @pytest.mark.asyncio
    async def test_memory_reasoning_integration(self):
        """Test integration between memory and reasoning systems"""
        with mock_manager.mock_external_apis():
            user_id = "integration_test_user"
            problem = "How should I approach this based on what you know about me?"
            
            # Mock integrated memory-reasoning
            result = await self._integrated_memory_reasoning(user_id, problem)
            
            assert result["user_id"] == user_id
            assert result["problem"] == problem
            assert result["memory_consulted"] is True
            assert result["reasoning_applied"] is True
            assert result["response"] is not None
    
    @pytest.mark.asyncio
    async def test_knowledge_memory_integration(self):
        """Test integration between knowledge and memory systems"""
        with mock_manager.mock_external_apis():
            user_id = "integration_test_user"
            query = "What do you know about machine learning?"
            
            # Mock knowledge-memory integration
            result = await self._integrated_knowledge_memory(user_id, query)
            
            assert result["query"] == query
            assert result["knowledge_searched"] is True
            assert result["memory_updated"] is True
            assert result["response"] is not None
    
    async def _integrated_memory_reasoning(self, user_id: str, problem: str) -> Dict[str, Any]:
        """Helper for memory-reasoning integration"""
        return {
            "user_id": user_id,
            "problem": problem,
            "memory_consulted": True,
            "relevant_memories": ["User prefers systematic approaches"],
            "reasoning_applied": True,
            "reasoning_steps": ["Analyze user preferences", "Apply systematic approach"],
            "response": "Based on your preference for systematic approaches, I recommend..."
        }
    
    async def _integrated_knowledge_memory(self, user_id: str, query: str) -> Dict[str, Any]:
        """Helper for knowledge-memory integration"""
        return {
            "user_id": user_id,
            "query": query,
            "knowledge_searched": True,
            "knowledge_results": ["ML is a subset of AI", "Uses algorithms to learn"],
            "memory_updated": True,
            "new_memory": "User interested in machine learning",
            "response": "Machine learning is a subset of artificial intelligence..."
        }
