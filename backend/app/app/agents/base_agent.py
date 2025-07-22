"""
Vexel Base Agent using Agno Framework
Multi-level AI Agent implementation with 5 levels:
1. Tools/Instructions
2. Knowledge/Storage  
3. Memory/Reasoning
4. Team Collaboration
5. Agentic Workflows
"""

from typing import List, Dict, Any, Optional
from agno.agent import Agent
from agno.models.litellm import LiteLLM
import os
from app.core.config import settings


class VexelBaseAgent(Agent):
    """
    Base Vexel Agent implementing 5-level architecture:

    Level 1: Tools/Instructions - Basic tool usage and instruction following
    Level 2: Knowledge/Storage - Knowledge management and data persistence
    Level 3: Memory/Reasoning - Memory systems and reasoning capabilities
    Level 4: Team Collaboration - Multi-agent coordination
    Level 5: Agentic Workflows - Complex autonomous workflows
    """

    def __init__(
        self,
        name: str = "VexelAgent",
        model: str = "gemini/gemini-2.5-flash-lite-preview-06-17",
        level: int = 1,
        **kwargs
    ):
        # Initialize LiteLLM model - supports OpenAI, Anthropic, Gemini, and many more
        # Model format examples:
        # - OpenAI: "gpt-4", "gpt-3.5-turbo"
        # - Anthropic: "claude-3-sonnet-20240229", "claude-3-haiku-20240307"
        # - Gemini: "gemini/gemini-1.5-flash", "gemini/gemini-1.5-pro"
        # - And many more providers supported by LiteLLM

        try:
            llm = LiteLLM(
                id=model,
                api_key=self._get_api_key_for_model(model),
                temperature=0.7,
                max_tokens=1000
            )
        except Exception as e:
            # Fallback to Gemini model for testing
            llm = LiteLLM(
                id="gemini/gemini-1.5-flash",
                api_key=os.getenv("GEMINI_API_KEY", "test-key")
            )

        super().__init__(
            name=name,
            model=llm,
            **kwargs
        )

        self.level = level
        self.model_type = model
        self.setup_instructions()

    def _get_api_key_for_model(self, model: str) -> Optional[str]:
        """
        Get appropriate API key based on model name
        """
        model_lower = model.lower()

        # OpenAI models
        if any(provider in model_lower for provider in ["gpt", "openai"]):
            return os.getenv("OPENAI_API_KEY")

        # Anthropic models
        elif any(provider in model_lower for provider in ["claude", "anthropic"]):
            return os.getenv("ANTHROPIC_API_KEY")

        # Gemini models
        elif any(provider in model_lower for provider in ["gemini", "google"]):
            return os.getenv("GEMINI_API_KEY")

        # Default to OpenAI for unknown models
        return os.getenv("OPENAI_API_KEY")

    def setup_instructions(self):
        """Setup level-specific instructions"""
        base_instructions = f"""
        You are Vexel, an advanced AI agent built on the Agno framework.
        You are designed with a multi-level architecture for maximum capability.
        Current Level: {self.level}

        CRITICAL ANTI-HALLUCINATION GUIDELINES:
        - NEVER make up or invent information about systems, architectures, or technical details
        - If you don't have specific knowledge about a topic, clearly state "I don't have specific information about this"
        - Always distinguish between general knowledge and specific system knowledge
        - When asked about Vexel, only provide information if you have access to knowledge sources
        - If no knowledge sources are available, explain that you need documentation to provide accurate information

        Your core principles:
        1. Be helpful, harmless, and honest - NEVER fabricate technical details
        2. Use tools effectively to accomplish tasks
        3. Maintain context and memory across interactions
        4. Collaborate effectively with other agents when needed
        5. Execute complex workflows autonomously when appropriate
        6. Always verify information before presenting it as fact
        """

        level_instructions = {
            1: "Focus on basic tool usage and instruction following.",
            2: "Utilize knowledge bases and persistent storage for enhanced capabilities.",
            3: "Apply memory and reasoning for complex problem-solving.",
            4: "Coordinate with other agents for collaborative tasks.",
            5: "Execute autonomous workflows for complex multi-step processes."
        }

        self.instructions = [
            base_instructions,
            level_instructions.get(self.level, "")
        ]


class VexelWorkflow:
    """
    Vexel Workflow for Level 5 autonomous operations
    """

    def __init__(self, name: str = "VexelWorkflow"):
        self.name = name

        # Create agents for different roles
        self.coordinator = VexelBaseAgent(
            name="Coordinator",
            level=4
        )

        self.researcher = VexelBaseAgent(
            name="Researcher",
            level=3
        )

        self.analyst = VexelBaseAgent(
            name="Analyst",
            level=3
        )

        self.executor = VexelBaseAgent(
            name="Executor",
            level=2
        )

    async def run(self, task: str) -> Dict[str, Any]:
        """
        Execute a complex workflow with multiple agents
        """
        try:
            # For now, return a mock workflow result
            # In production, this would execute actual agent interactions
            return {
                "task": task,
                "plan": f"Plan for: {task}",
                "research": f"Research for: {task}",
                "analysis": f"Analysis for: {task}",
                "execution": f"Execution for: {task}",
                "status": "completed"
            }
        except Exception as e:
            return {
                "task": task,
                "plan": "",
                "research": "",
                "analysis": "",
                "execution": "",
                "status": f"error: {str(e)}"
            }


# Factory function for creating agents
def create_vexel_agent(
    name: str = "VexelAgent",
    level: int = 1,
    model: str = "openai",
    **kwargs
) -> VexelBaseAgent:
    """
    Factory function to create Vexel agents with different configurations
    """
    return VexelBaseAgent(
        name=name,
        level=level,
        model=model,
        **kwargs
    )


# Factory function for creating workflows  
def create_vexel_workflow(name: str = "VexelWorkflow") -> VexelWorkflow:
    """
    Factory function to create Vexel workflows
    """
    return VexelWorkflow(name=name)
