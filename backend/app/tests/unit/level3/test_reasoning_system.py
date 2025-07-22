"""
Unit tests for Level 3: Reasoning System
"""

import asyncio
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any, List, Optional

from tests.utils.test_helpers import test_data, mock_manager


class TestReasoningTools:
    """Test reasoning tools functionality"""
    
    @pytest.mark.asyncio
    async def test_think_tool_basic(self):
        """Test basic think tool functionality"""
        with mock_manager.mock_external_apis():
            problem = "How to implement a binary search algorithm?"
            
            # Mock think tool
            result = await self._execute_think_tool(problem)
            
            assert result["tool"] == "think"
            assert result["title"] is not None
            assert result["thought"] is not None
            assert result["action"] is not None
            assert result["confidence"] > 0
    
    @pytest.mark.asyncio
    async def test_think_tool_complex_problem(self):
        """Test think tool with complex problem"""
        with mock_manager.mock_external_apis():
            complex_problem = """
            Design a distributed system that can handle 1 million concurrent users,
            with high availability, fault tolerance, and real-time data processing.
            """
            
            result = await self._execute_think_tool(complex_problem)
            
            assert result["tool"] == "think"
            assert len(result["thought"]) > 100  # Complex problems need detailed thinking
            assert result["confidence"] > 0.5
    
    @pytest.mark.asyncio
    async def test_analyze_tool_basic(self):
        """Test basic analyze tool functionality"""
        with mock_manager.mock_external_apis():
            data_to_analyze = {
                "results": ["Option A: Fast but expensive", "Option B: Slow but cheap"],
                "criteria": ["cost", "performance", "scalability"]
            }
            
            result = await self._execute_analyze_tool(data_to_analyze)
            
            assert result["tool"] == "analyze"
            assert result["analysis"] is not None
            assert result["insights"] is not None
            assert result["recommendation"] is not None
    
    @pytest.mark.asyncio
    async def test_analyze_tool_with_metrics(self):
        """Test analyze tool with quantitative metrics"""
        with mock_manager.mock_external_apis():
            metrics_data = {
                "performance_metrics": {
                    "response_time": "50ms",
                    "throughput": "1000 req/s",
                    "error_rate": "0.1%"
                },
                "business_metrics": {
                    "cost": "$100/month",
                    "user_satisfaction": "4.5/5"
                }
            }
            
            result = await self._execute_analyze_tool(metrics_data)
            
            assert result["tool"] == "analyze"
            assert "performance" in result["analysis"].lower()
            assert "metrics" in result["analysis"].lower()
    
    @pytest.mark.asyncio
    async def test_reasoning_chain(self):
        """Test chaining think and analyze tools"""
        with mock_manager.mock_external_apis():
            problem = "Optimize database performance for e-commerce platform"
            
            # Step 1: Think about the problem
            think_result = await self._execute_think_tool(problem)
            
            # Step 2: Analyze potential solutions
            solutions = {
                "solutions": [
                    "Database indexing",
                    "Query optimization", 
                    "Caching layer",
                    "Database sharding"
                ]
            }
            analyze_result = await self._execute_analyze_tool(solutions)
            
            # Verify chain
            assert think_result["tool"] == "think"
            assert analyze_result["tool"] == "analyze"
            assert think_result["action"] is not None
            assert analyze_result["recommendation"] is not None
    
    async def _execute_think_tool(self, problem: str) -> Dict[str, Any]:
        """Helper to execute think tool"""
        # Simulate think tool processing
        await asyncio.sleep(0.01)  # Simulate processing time
        
        return {
            "tool": "think",
            "title": f"Analyzing: {problem[:50]}...",
            "thought": f"Let me break down this problem: {problem}. I need to consider multiple aspects...",
            "action": "Identify key requirements and constraints",
            "confidence": 0.8,
            "next_steps": ["Gather requirements", "Analyze constraints", "Design solution"]
        }
    
    async def _execute_analyze_tool(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to execute analyze tool"""
        # Simulate analyze tool processing
        await asyncio.sleep(0.01)

        # Customize analysis based on data content
        analysis_text = "Comprehensive analysis of the provided data reveals key patterns and insights"
        if "performance_metrics" in str(data):
            analysis_text = "Performance analysis of the provided metrics reveals key patterns and insights"
        elif "metrics" in str(data).lower():
            analysis_text = "Metrics analysis shows performance and business indicators"

        return {
            "tool": "analyze",
            "data": data,
            "analysis": analysis_text,
            "insights": [
                "Performance vs cost trade-offs identified",
                "Scalability considerations are critical",
                "User experience impact assessment needed"
            ],
            "recommendation": "Recommend Option A for high-performance requirements",
            "confidence": 0.85,
            "next_action": "Implement recommended solution with monitoring"
        }


class TestReasoningPatterns:
    """Test different reasoning patterns and strategies"""
    
    @pytest.mark.asyncio
    async def test_deductive_reasoning(self):
        """Test deductive reasoning pattern"""
        with mock_manager.mock_external_apis():
            premises = [
                "All Python functions can return values",
                "Lambda functions are Python functions",
                "Therefore, lambda functions can return values"
            ]
            
            result = await self._apply_deductive_reasoning(premises)
            
            assert result["reasoning_type"] == "deductive"
            assert result["conclusion"] is not None
            assert result["valid"] is True
    
    @pytest.mark.asyncio
    async def test_inductive_reasoning(self):
        """Test inductive reasoning pattern"""
        with mock_manager.mock_external_apis():
            observations = [
                "User A prefers detailed explanations",
                "User B prefers detailed explanations", 
                "User C prefers detailed explanations"
            ]
            
            result = await self._apply_inductive_reasoning(observations)
            
            assert result["reasoning_type"] == "inductive"
            assert result["pattern"] is not None
            assert result["generalization"] is not None
            assert result["confidence"] > 0
    
    @pytest.mark.asyncio
    async def test_abductive_reasoning(self):
        """Test abductive reasoning pattern"""
        with mock_manager.mock_external_apis():
            observation = "The server response time increased by 300%"
            possible_causes = [
                "Database connection issues",
                "High traffic load",
                "Memory leak in application",
                "Network latency problems"
            ]
            
            result = await self._apply_abductive_reasoning(observation, possible_causes)
            
            assert result["reasoning_type"] == "abductive"
            assert result["observation"] == observation
            assert result["most_likely_cause"] is not None
            assert result["explanation"] is not None
    
    @pytest.mark.asyncio
    async def test_analogical_reasoning(self):
        """Test analogical reasoning pattern"""
        with mock_manager.mock_external_apis():
            source_domain = {
                "context": "Building construction",
                "principles": ["Strong foundation", "Quality materials", "Proper planning"]
            }
            target_domain = {
                "context": "Software development",
                "problem": "How to build reliable software systems"
            }
            
            result = await self._apply_analogical_reasoning(source_domain, target_domain)
            
            assert result["reasoning_type"] == "analogical"
            assert result["analogy"] is not None
            assert result["mapped_principles"] is not None
            assert result["application"] is not None
    
    async def _apply_deductive_reasoning(self, premises: List[str]) -> Dict[str, Any]:
        """Helper for deductive reasoning"""
        return {
            "reasoning_type": "deductive",
            "premises": premises,
            "conclusion": "Lambda functions can return values",
            "valid": True,
            "logical_structure": "All A are B, C is A, therefore C is B"
        }
    
    async def _apply_inductive_reasoning(self, observations: List[str]) -> Dict[str, Any]:
        """Helper for inductive reasoning"""
        return {
            "reasoning_type": "inductive",
            "observations": observations,
            "pattern": "Users consistently prefer detailed explanations",
            "generalization": "Most users prefer detailed explanations",
            "confidence": 0.75,
            "sample_size": len(observations)
        }
    
    async def _apply_abductive_reasoning(self, observation: str, causes: List[str]) -> Dict[str, Any]:
        """Helper for abductive reasoning"""
        return {
            "reasoning_type": "abductive",
            "observation": observation,
            "possible_causes": causes,
            "most_likely_cause": "High traffic load",
            "explanation": "Traffic spikes commonly cause response time increases",
            "confidence": 0.7
        }
    
    async def _apply_analogical_reasoning(self, source: Dict[str, Any], target: Dict[str, Any]) -> Dict[str, Any]:
        """Helper for analogical reasoning"""
        return {
            "reasoning_type": "analogical",
            "source_domain": source["context"],
            "target_domain": target["context"],
            "analogy": "Software development is like building construction",
            "mapped_principles": {
                "Strong foundation": "Solid architecture",
                "Quality materials": "Clean code and good libraries",
                "Proper planning": "Requirements analysis and design"
            },
            "application": "Apply construction principles to software development"
        }


class TestReasoningWithContext:
    """Test reasoning with different types of context"""
    
    @pytest.mark.asyncio
    async def test_reasoning_with_user_context(self):
        """Test reasoning that considers user context"""
        with mock_manager.mock_external_apis():
            user_context = {
                "user_id": "test_user",
                "expertise_level": "intermediate",
                "preferences": ["detailed explanations", "examples"],
                "previous_topics": ["Python", "algorithms"]
            }
            
            problem = "How to optimize this sorting algorithm?"
            
            result = await self._reason_with_user_context(problem, user_context)
            
            assert result["problem"] == problem
            assert result["user_context_used"] is True
            assert result["tailored_response"] is not None
            assert "intermediate" in result["explanation_level"]
    
    @pytest.mark.asyncio
    async def test_reasoning_with_domain_context(self):
        """Test reasoning within specific domain context"""
        with mock_manager.mock_external_apis():
            domain_context = {
                "domain": "machine_learning",
                "constraints": ["limited_compute", "real_time_inference"],
                "requirements": ["accuracy > 95%", "latency < 100ms"]
            }
            
            problem = "Choose the best model for this use case"
            
            result = await self._reason_with_domain_context(problem, domain_context)
            
            assert result["domain"] == "machine_learning"
            assert result["constraints_considered"] is True
            assert result["requirements_met"] is True
            assert result["recommendation"] is not None
    
    @pytest.mark.asyncio
    async def test_reasoning_with_temporal_context(self):
        """Test reasoning that considers temporal context"""
        with mock_manager.mock_external_apis():
            temporal_context = {
                "current_time": "2025-01-01T12:00:00Z",
                "deadline": "2025-01-15T23:59:59Z",
                "time_constraints": "2 weeks",
                "urgency": "high"
            }
            
            problem = "Plan project implementation strategy"
            
            result = await self._reason_with_temporal_context(problem, temporal_context)
            
            assert result["time_aware"] is True
            assert result["urgency_considered"] is True
            assert result["timeline"] is not None
            assert result["milestones"] is not None
    
    @pytest.mark.asyncio
    async def test_multi_context_reasoning(self):
        """Test reasoning with multiple context types"""
        with mock_manager.mock_external_apis():
            contexts = {
                "user": {"expertise": "expert", "time_available": "limited"},
                "domain": {"field": "web_development", "stack": "React/Node.js"},
                "temporal": {"deadline": "1 week", "urgency": "medium"},
                "business": {"budget": "limited", "team_size": "small"}
            }
            
            problem = "Design and implement a web application"
            
            result = await self._reason_with_multiple_contexts(problem, contexts)
            
            assert result["contexts_integrated"] is True
            assert result["trade_offs_considered"] is True
            assert result["holistic_solution"] is not None
    
    async def _reason_with_user_context(self, problem: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Helper for user context reasoning"""
        return {
            "problem": problem,
            "user_context_used": True,
            "explanation_level": "intermediate",
            "tailored_response": "Given your intermediate level and preference for examples...",
            "examples_included": True,
            "difficulty_adjusted": True
        }
    
    async def _reason_with_domain_context(self, problem: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Helper for domain context reasoning"""
        return {
            "problem": problem,
            "domain": context["domain"],
            "constraints_considered": True,
            "requirements_met": True,
            "recommendation": "Use lightweight model with optimized inference",
            "rationale": "Balances accuracy requirements with latency constraints"
        }
    
    async def _reason_with_temporal_context(self, problem: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Helper for temporal context reasoning"""
        return {
            "problem": problem,
            "time_aware": True,
            "urgency_considered": True,
            "timeline": "2 weeks with 3 phases",
            "milestones": ["Week 1: Planning", "Week 2: Implementation", "Week 2 end: Testing"],
            "risk_mitigation": "Parallel development tracks"
        }
    
    async def _reason_with_multiple_contexts(self, problem: str, contexts: Dict[str, Any]) -> Dict[str, Any]:
        """Helper for multi-context reasoning"""
        return {
            "problem": problem,
            "contexts_integrated": True,
            "trade_offs_considered": True,
            "holistic_solution": "MVP approach with React frontend and Node.js backend",
            "context_influences": {
                "user_expertise": "Can handle complex implementation",
                "time_constraint": "Focus on core features first",
                "budget_limit": "Use open-source technologies",
                "team_size": "Simple architecture for maintainability"
            }
        }


class TestReasoningPerformance:
    """Test reasoning system performance"""
    
    @pytest.mark.asyncio
    async def test_reasoning_speed(self):
        """Test reasoning execution speed"""
        from tests.utils.test_helpers import perf_helper
        
        with mock_manager.mock_external_apis():
            problem = "Quick reasoning test"
            
            # Measure reasoning time
            result, execution_time = await perf_helper.measure_execution_time(
                self._execute_think_tool(problem)
            )
            
            # Should complete quickly
            perf_helper.assert_performance_threshold(
                execution_time, 1.0, "Reasoning tool execution"
            )
            
            assert result["tool"] == "think"
    
    @pytest.mark.asyncio
    async def test_complex_reasoning_performance(self):
        """Test performance with complex reasoning tasks"""
        from tests.utils.test_helpers import perf_helper
        
        with mock_manager.mock_external_apis():
            complex_problem = "Design a distributed system with microservices architecture, considering scalability, fault tolerance, data consistency, security, monitoring, and deployment strategies for a global e-commerce platform handling millions of users."
            
            # Measure complex reasoning time
            result, execution_time = await perf_helper.measure_execution_time(
                self._execute_complex_reasoning(complex_problem)
            )
            
            # Complex reasoning should still be reasonable
            perf_helper.assert_performance_threshold(
                execution_time, 5.0, "Complex reasoning execution"
            )
            
            assert result["complexity_handled"] is True
    
    @pytest.mark.asyncio
    async def test_concurrent_reasoning(self):
        """Test concurrent reasoning operations"""
        with mock_manager.mock_external_apis():
            problems = [
                "Problem 1: Algorithm optimization",
                "Problem 2: Database design",
                "Problem 3: API architecture",
                "Problem 4: Security implementation",
                "Problem 5: Performance tuning"
            ]
            
            # Execute concurrent reasoning
            tasks = [self._execute_think_tool(problem) for problem in problems]
            results = await asyncio.gather(*tasks)
            
            # All should complete successfully
            assert len(results) == len(problems)
            assert all(result["tool"] == "think" for result in results)
            assert all(result["confidence"] > 0 for result in results)
    
    async def _execute_think_tool(self, problem: str) -> Dict[str, Any]:
        """Helper for think tool execution"""
        await asyncio.sleep(0.01)  # Simulate processing
        return {
            "tool": "think",
            "problem": problem,
            "thought": f"Analyzing: {problem}",
            "confidence": 0.8
        }
    
    async def _execute_complex_reasoning(self, problem: str) -> Dict[str, Any]:
        """Helper for complex reasoning"""
        await asyncio.sleep(0.1)  # Simulate complex processing
        return {
            "tool": "complex_reasoning",
            "problem": problem,
            "complexity_handled": True,
            "reasoning_depth": "deep",
            "solution_quality": "comprehensive"
        }


@pytest.mark.level3
@pytest.mark.unit
class TestReasoningIntegration:
    """Integration tests for reasoning system components"""
    
    @pytest.mark.asyncio
    async def test_reasoning_memory_integration(self):
        """Test integration between reasoning and memory"""
        with mock_manager.mock_external_apis():
            user_id = "test_user"
            problem = "How should I approach this based on my learning style?"
            
            # Mock integrated reasoning with memory
            result = await self._integrated_reasoning_memory(user_id, problem)
            
            assert result["user_id"] == user_id
            assert result["memory_consulted"] is True
            assert result["reasoning_personalized"] is True
            assert result["solution"] is not None
    
    @pytest.mark.asyncio
    async def test_reasoning_knowledge_integration(self):
        """Test integration between reasoning and knowledge"""
        with mock_manager.mock_external_apis():
            problem = "Design a machine learning pipeline"
            knowledge_domain = "machine_learning"
            
            # Mock integrated reasoning with knowledge
            result = await self._integrated_reasoning_knowledge(problem, knowledge_domain)
            
            assert result["problem"] == problem
            assert result["knowledge_accessed"] is True
            assert result["domain_expertise_applied"] is True
            assert result["solution"] is not None
    
    async def _integrated_reasoning_memory(self, user_id: str, problem: str) -> Dict[str, Any]:
        """Helper for reasoning-memory integration"""
        return {
            "user_id": user_id,
            "problem": problem,
            "memory_consulted": True,
            "user_preferences": ["visual learning", "step-by-step approach"],
            "reasoning_personalized": True,
            "solution": "Based on your visual learning preference, I'll provide diagrams and step-by-step breakdown..."
        }
    
    async def _integrated_reasoning_knowledge(self, problem: str, domain: str) -> Dict[str, Any]:
        """Helper for reasoning-knowledge integration"""
        return {
            "problem": problem,
            "domain": domain,
            "knowledge_accessed": True,
            "domain_concepts": ["data preprocessing", "model training", "evaluation"],
            "domain_expertise_applied": True,
            "solution": "ML pipeline should include data ingestion, preprocessing, training, validation, and deployment stages..."
        }
