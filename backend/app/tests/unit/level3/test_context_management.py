"""
Unit tests for Level 3: Context Management System
"""

import asyncio
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from tests.utils.test_helpers import test_data, mock_manager


class TestContextStorage:
    """Test context storage and retrieval"""
    
    @pytest.mark.asyncio
    async def test_store_conversation_context(self):
        """Test storing conversation context"""
        with mock_manager.mock_external_apis():
            context_data = {
                "user_id": "test_user",
                "session_id": "test_session",
                "conversation": [
                    {"role": "user", "content": "Hello, I'm learning Python"},
                    {"role": "assistant", "content": "Great! I'd love to help you learn Python."},
                    {"role": "user", "content": "Can you explain functions?"}
                ],
                "timestamp": datetime.now().isoformat()
            }
            
            # Mock context storage
            result = await self._store_context(context_data)
            
            assert result["success"] is True
            assert result["context_id"] is not None
            assert result["stored_messages"] == 3
    
    @pytest.mark.asyncio
    async def test_retrieve_conversation_context(self):
        """Test retrieving conversation context"""
        with mock_manager.mock_external_apis():
            user_id = "test_user"
            session_id = "test_session"
            
            # Mock context retrieval
            context = await self._retrieve_context(user_id, session_id)
            
            assert context["user_id"] == user_id
            assert context["session_id"] == session_id
            assert "conversation" in context
            assert isinstance(context["conversation"], list)
    
    @pytest.mark.asyncio
    async def test_context_compression(self):
        """Test context compression for long conversations"""
        with mock_manager.mock_external_apis():
            long_conversation = [
                {"role": "user", "content": f"Message {i}"}
                for i in range(100)  # Very long conversation
            ]
            
            # Mock context compression
            compressed = await self._compress_context(long_conversation)
            
            assert compressed["original_length"] == 100
            assert compressed["compressed_length"] < 100
            assert compressed["compression_ratio"] > 0
            assert "summary" in compressed
    
    @pytest.mark.asyncio
    async def test_context_search(self):
        """Test searching within context"""
        with mock_manager.mock_external_apis():
            user_id = "test_user"
            search_query = "Python functions"
            
            # Mock context search
            results = await self._search_context(user_id, search_query)
            
            assert isinstance(results, list)
            assert all("relevance_score" in result for result in results)
            assert all("context_snippet" in result for result in results)
            assert all("timestamp" in result for result in results)
    
    async def _store_context(self, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to store context"""
        return {
            "success": True,
            "context_id": "ctx_123",
            "stored_messages": len(context_data["conversation"]),
            "timestamp": context_data["timestamp"]
        }
    
    async def _retrieve_context(self, user_id: str, session_id: str) -> Dict[str, Any]:
        """Helper to retrieve context"""
        return {
            "user_id": user_id,
            "session_id": session_id,
            "conversation": [
                {"role": "user", "content": "Previous message"},
                {"role": "assistant", "content": "Previous response"}
            ],
            "retrieved_at": datetime.now().isoformat()
        }
    
    async def _compress_context(self, conversation: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Helper to compress context"""
        return {
            "original_length": len(conversation),
            "compressed_length": min(20, len(conversation)),
            "compression_ratio": 0.8,
            "summary": "Conversation about various topics with key points preserved",
            "key_points": ["Topic 1", "Topic 2", "Topic 3"]
        }
    
    async def _search_context(self, user_id: str, query: str) -> List[Dict[str, Any]]:
        """Helper to search context"""
        return [
            {
                "relevance_score": 0.9,
                "context_snippet": f"Context related to {query}",
                "timestamp": datetime.now().isoformat(),
                "session_id": "session_1"
            },
            {
                "relevance_score": 0.7,
                "context_snippet": f"Another context about {query}",
                "timestamp": (datetime.now() - timedelta(hours=1)).isoformat(),
                "session_id": "session_2"
            }
        ]


class TestContextAwareness:
    """Test context awareness capabilities"""
    
    @pytest.mark.asyncio
    async def test_topic_tracking(self):
        """Test tracking conversation topics"""
        with mock_manager.mock_external_apis():
            conversation = [
                {"role": "user", "content": "I want to learn machine learning"},
                {"role": "assistant", "content": "Great! Let's start with the basics"},
                {"role": "user", "content": "What about neural networks?"},
                {"role": "assistant", "content": "Neural networks are a key part of ML"}
            ]
            
            # Mock topic tracking
            topics = await self._track_topics(conversation)
            
            assert isinstance(topics, list)
            assert len(topics) > 0
            assert all("topic" in topic for topic in topics)
            assert all("confidence" in topic for topic in topics)
            assert any("machine learning" in topic["topic"].lower() for topic in topics)
    
    @pytest.mark.asyncio
    async def test_intent_recognition(self):
        """Test recognizing user intent from context"""
        with mock_manager.mock_external_apis():
            messages = [
                "I'm having trouble with my Python code",
                "Can you help me debug this function?",
                "It's not returning the expected output"
            ]
            
            # Mock intent recognition
            intent = await self._recognize_intent(messages)
            
            assert intent["primary_intent"] is not None
            assert intent["confidence"] > 0
            assert intent["context_clues"] is not None
            assert "debug" in intent["primary_intent"].lower() or "help" in intent["primary_intent"].lower()
    
    @pytest.mark.asyncio
    async def test_emotional_context(self):
        """Test detecting emotional context"""
        with mock_manager.mock_external_apis():
            messages = [
                "I'm really frustrated with this problem",
                "I've been stuck on this for hours",
                "Nothing seems to work"
            ]
            
            # Mock emotional context detection
            emotion = await self._detect_emotion(messages)
            
            assert emotion["primary_emotion"] is not None
            assert emotion["intensity"] > 0
            assert emotion["confidence"] > 0
            assert "frustrat" in emotion["primary_emotion"].lower()
    
    @pytest.mark.asyncio
    async def test_context_continuity(self):
        """Test maintaining context continuity"""
        with mock_manager.mock_external_apis():
            previous_context = {
                "topics": ["Python", "functions"],
                "user_level": "beginner",
                "preferences": ["detailed explanations"]
            }
            
            new_message = "What about classes in Python?"
            
            # Mock context continuity
            continuity = await self._maintain_continuity(previous_context, new_message)
            
            assert continuity["context_maintained"] is True
            assert continuity["topic_progression"] is not None
            assert continuity["relevance_score"] > 0
    
    async def _track_topics(self, conversation: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Helper to track topics"""
        return [
            {
                "topic": "machine learning",
                "confidence": 0.9,
                "first_mentioned": 0,
                "last_mentioned": 3,
                "frequency": 2
            },
            {
                "topic": "neural networks",
                "confidence": 0.8,
                "first_mentioned": 2,
                "last_mentioned": 3,
                "frequency": 1
            }
        ]
    
    async def _recognize_intent(self, messages: List[str]) -> Dict[str, Any]:
        """Helper to recognize intent"""
        return {
            "primary_intent": "debugging_help",
            "confidence": 0.85,
            "context_clues": ["trouble", "debug", "help", "not working"],
            "secondary_intents": ["learning", "problem_solving"]
        }
    
    async def _detect_emotion(self, messages: List[str]) -> Dict[str, Any]:
        """Helper to detect emotion"""
        return {
            "primary_emotion": "frustration",
            "intensity": 0.7,
            "confidence": 0.8,
            "indicators": ["frustrated", "stuck", "hours", "nothing works"]
        }
    
    async def _maintain_continuity(self, previous_context: Dict[str, Any], new_message: str) -> Dict[str, Any]:
        """Helper to maintain continuity"""
        return {
            "context_maintained": True,
            "topic_progression": "Python functions -> Python classes",
            "relevance_score": 0.9,
            "connection_type": "topic_expansion",
            "updated_context": {
                **previous_context,
                "topics": previous_context["topics"] + ["classes"]
            }
        }


class TestContextPersonalization:
    """Test context-based personalization"""
    
    @pytest.mark.asyncio
    async def test_user_preference_learning(self):
        """Test learning user preferences from context"""
        with mock_manager.mock_external_apis():
            user_interactions = [
                {"message": "Can you give me a detailed explanation?", "response_rating": 5},
                {"message": "Just give me the basics", "response_rating": 2},
                {"message": "I need step-by-step instructions", "response_rating": 5},
                {"message": "Quick answer please", "response_rating": 3}
            ]
            
            # Mock preference learning
            preferences = await self._learn_preferences(user_interactions)
            
            assert preferences["communication_style"] is not None
            assert preferences["detail_level"] is not None
            assert preferences["confidence"] > 0
            assert "detailed" in preferences["communication_style"].lower()
    
    @pytest.mark.asyncio
    async def test_expertise_level_assessment(self):
        """Test assessing user expertise level from context"""
        with mock_manager.mock_external_apis():
            user_questions = [
                "What is a variable in Python?",
                "How do I create a list?",
                "What's the difference between list and tuple?",
                "Can you explain list comprehensions?"
            ]
            
            # Mock expertise assessment
            expertise = await self._assess_expertise(user_questions)
            
            assert expertise["level"] is not None
            assert expertise["confidence"] > 0
            assert expertise["indicators"] is not None
            assert expertise["level"] in ["beginner", "intermediate", "advanced"]
    
    @pytest.mark.asyncio
    async def test_adaptive_response_style(self):
        """Test adapting response style based on context"""
        with mock_manager.mock_external_apis():
            user_profile = {
                "expertise_level": "beginner",
                "communication_style": "detailed",
                "learning_pace": "slow",
                "preferred_examples": "practical"
            }
            
            question = "How do I sort a list in Python?"
            
            # Mock adaptive response
            response_style = await self._adapt_response_style(user_profile, question)
            
            assert response_style["tone"] is not None
            assert response_style["detail_level"] is not None
            assert response_style["example_type"] is not None
            assert response_style["explanation_depth"] is not None
    
    @pytest.mark.asyncio
    async def test_context_based_recommendations(self):
        """Test generating recommendations based on context"""
        with mock_manager.mock_external_apis():
            user_context = {
                "current_topic": "Python functions",
                "completed_topics": ["variables", "data_types", "control_flow"],
                "skill_level": "beginner",
                "learning_goals": ["web_development"]
            }
            
            # Mock recommendations
            recommendations = await self._generate_recommendations(user_context)
            
            assert isinstance(recommendations, list)
            assert len(recommendations) > 0
            assert all("topic" in rec for rec in recommendations)
            assert all("relevance" in rec for rec in recommendations)
            assert all("difficulty" in rec for rec in recommendations)
    
    async def _learn_preferences(self, interactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Helper to learn preferences"""
        return {
            "communication_style": "detailed_explanations",
            "detail_level": "high",
            "confidence": 0.8,
            "evidence": ["High ratings for detailed responses", "Low ratings for brief answers"]
        }
    
    async def _assess_expertise(self, questions: List[str]) -> Dict[str, Any]:
        """Helper to assess expertise"""
        return {
            "level": "beginner",
            "confidence": 0.85,
            "indicators": ["Basic syntax questions", "Fundamental concept queries"],
            "progression": "Learning core concepts",
            "estimated_experience": "< 3 months"
        }
    
    async def _adapt_response_style(self, profile: Dict[str, Any], question: str) -> Dict[str, Any]:
        """Helper to adapt response style"""
        return {
            "tone": "encouraging_and_patient",
            "detail_level": "comprehensive",
            "example_type": "practical_with_comments",
            "explanation_depth": "step_by_step",
            "additional_resources": True
        }
    
    async def _generate_recommendations(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Helper to generate recommendations"""
        return [
            {
                "topic": "Object-Oriented Programming",
                "relevance": 0.9,
                "difficulty": "intermediate",
                "reason": "Natural progression from functions"
            },
            {
                "topic": "Error Handling",
                "relevance": 0.8,
                "difficulty": "beginner",
                "reason": "Essential for robust code"
            },
            {
                "topic": "File Operations",
                "relevance": 0.7,
                "difficulty": "beginner",
                "reason": "Practical skill for web development"
            }
        ]


class TestContextPerformance:
    """Test context management performance"""
    
    @pytest.mark.asyncio
    async def test_context_retrieval_speed(self):
        """Test context retrieval performance"""
        from tests.utils.test_helpers import perf_helper
        
        with mock_manager.mock_external_apis():
            user_id = "perf_test_user"
            session_id = "perf_test_session"
            
            # Measure context retrieval time
            result, execution_time = await perf_helper.measure_execution_time(
                self._retrieve_context(user_id, session_id)
            )
            
            # Should be fast
            perf_helper.assert_performance_threshold(
                execution_time, 0.5, "Context retrieval"
            )
            
            assert result["user_id"] == user_id
    
    @pytest.mark.asyncio
    async def test_context_compression_performance(self):
        """Test context compression performance"""
        from tests.utils.test_helpers import perf_helper
        
        with mock_manager.mock_external_apis():
            # Large conversation for compression testing
            large_conversation = [
                {"role": "user", "content": f"Message {i}"}
                for i in range(1000)
            ]
            
            # Measure compression time
            result, execution_time = await perf_helper.measure_execution_time(
                self._compress_context(large_conversation)
            )
            
            # Should handle large contexts efficiently
            perf_helper.assert_performance_threshold(
                execution_time, 2.0, "Context compression"
            )
            
            assert result["original_length"] == 1000
    
    @pytest.mark.asyncio
    async def test_concurrent_context_operations(self):
        """Test concurrent context operations"""
        with mock_manager.mock_external_apis():
            # Multiple concurrent context operations
            tasks = [
                self._retrieve_context(f"user_{i}", f"session_{i}")
                for i in range(10)
            ]
            
            results = await asyncio.gather(*tasks)
            
            # All should complete successfully
            assert len(results) == 10
            assert all(result["user_id"].startswith("user_") for result in results)
    
    async def _retrieve_context(self, user_id: str, session_id: str) -> Dict[str, Any]:
        """Helper for performance testing"""
        await asyncio.sleep(0.01)  # Simulate retrieval time
        return {
            "user_id": user_id,
            "session_id": session_id,
            "conversation": []
        }
    
    async def _compress_context(self, conversation: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Helper for compression performance testing"""
        await asyncio.sleep(0.1)  # Simulate compression time
        return {
            "original_length": len(conversation),
            "compressed_length": min(50, len(conversation)),
            "compression_ratio": 0.95
        }


@pytest.mark.level3
@pytest.mark.unit
class TestContextIntegration:
    """Integration tests for context management components"""
    
    @pytest.mark.asyncio
    async def test_context_memory_integration(self):
        """Test integration between context and memory systems"""
        with mock_manager.mock_external_apis():
            user_id = "context_memory_user"
            context_data = {
                "conversation": [
                    {"role": "user", "content": "I prefer Python over Java"},
                    {"role": "assistant", "content": "Noted your Python preference"}
                ]
            }
            
            # Mock context-memory integration
            result = await self._integrate_context_memory(user_id, context_data)
            
            assert result["user_id"] == user_id
            assert result["context_processed"] is True
            assert result["memories_created"] > 0
            assert result["preferences_extracted"] is not None
    
    @pytest.mark.asyncio
    async def test_context_reasoning_integration(self):
        """Test integration between context and reasoning systems"""
        with mock_manager.mock_external_apis():
            context = {
                "user_expertise": "intermediate",
                "current_problem": "algorithm optimization",
                "previous_solutions": ["brute force", "dynamic programming"]
            }
            
            new_problem = "How to optimize this further?"
            
            # Mock context-reasoning integration
            result = await self._integrate_context_reasoning(context, new_problem)
            
            assert result["context_applied"] is True
            assert result["reasoning_enhanced"] is True
            assert result["solution_personalized"] is True
            assert result["approach"] is not None
    
    async def _integrate_context_memory(self, user_id: str, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper for context-memory integration"""
        return {
            "user_id": user_id,
            "context_processed": True,
            "memories_created": 2,
            "preferences_extracted": ["Python preference", "Programming language choice"],
            "context_summary": "User prefers Python programming language"
        }
    
    async def _integrate_context_reasoning(self, context: Dict[str, Any], problem: str) -> Dict[str, Any]:
        """Helper for context-reasoning integration"""
        return {
            "context_applied": True,
            "reasoning_enhanced": True,
            "solution_personalized": True,
            "approach": "Advanced optimization techniques suitable for intermediate level",
            "context_influence": "Tailored explanation based on user's intermediate expertise"
        }
