"""
Anti-hallucination utilities for Vexel AI agents
Provides functions to prevent AI agents from fabricating information
"""

from typing import List, Dict, Any, Optional
from agno.agent import Agent


class AntiHallucinationGuard:
    """
    Guard class to prevent AI agents from hallucinating information
    """
    
    @staticmethod
    def get_default_instructions() -> List[str]:
        """
        Get default anti-hallucination instructions for agents
        """
        return [
            "You are a helpful AI assistant. Follow these critical guidelines:",
            "1. NEVER fabricate or invent information about specific systems, architectures, or technical details",
            "2. If you don't have access to knowledge sources about a topic, clearly state this limitation",
            "3. Distinguish between general knowledge and specific system knowledge", 
            "4. When asked about specific projects or systems, only provide information if you have verified knowledge sources",
            "5. If uncertain about any information, express your uncertainty rather than guessing",
            "6. Always prioritize accuracy over completeness - it's better to say 'I don't know' than to provide incorrect information",
            "7. When asked about technical architectures, only describe what you can verify from available documentation",
            "8. If no knowledge base is available, explain that you need access to documentation to provide accurate information"
        ]
    
    @staticmethod
    def get_knowledge_disclaimer(has_knowledge_sources: bool = False) -> str:
        """
        Get disclaimer text based on whether agent has knowledge sources
        """
        if has_knowledge_sources:
            return "I have access to knowledge sources and will base my responses on verified information."
        else:
            return "I don't have access to specific knowledge sources about this system. I can only provide general information and cannot make claims about specific architectures or implementations without verified documentation."
    
    @staticmethod
    def validate_agent_response(response: str, has_knowledge_sources: bool = False) -> Dict[str, Any]:
        """
        Validate agent response for potential hallucination indicators
        """
        hallucination_indicators = [
            "data processing system",
            "distributed processing engine", 
            "data ingestion",
            "NoSQL databases for storage",
            "scalable data processing"
        ]
        
        found_indicators = []
        for indicator in hallucination_indicators:
            if indicator.lower() in response.lower():
                found_indicators.append(indicator)
        
        return {
            "has_potential_hallucination": len(found_indicators) > 0,
            "indicators_found": found_indicators,
            "has_knowledge_sources": has_knowledge_sources,
            "recommendation": "Review response for accuracy" if found_indicators else "Response appears safe"
        }
    
    @staticmethod
    def enhance_system_message(base_message: str, has_knowledge_sources: bool = False) -> str:
        """
        Enhance system message with anti-hallucination guidelines
        """
        knowledge_status = AntiHallucinationGuard.get_knowledge_disclaimer(has_knowledge_sources)
        
        enhanced_message = f"""
{base_message}

CRITICAL ANTI-HALLUCINATION GUIDELINES:
{knowledge_status}

STRICT RULES:
- Never invent technical details about systems you haven't been trained on
- Always distinguish between general knowledge and specific system knowledge
- If asked about specific projects/systems without knowledge sources, respond with: "I don't have access to specific documentation about this system. I would need verified knowledge sources to provide accurate technical details."
- When uncertain, use phrases like "I'm not certain about this specific detail" or "I would need to verify this information"
- Avoid making definitive statements about architectures, implementations, or technical specifications without verified sources

Remember: It's always better to admit uncertainty than to provide potentially incorrect information.
"""
        return enhanced_message.strip()


def create_safe_agent_instructions(
    base_instructions: Optional[List[str]] = None,
    has_knowledge_sources: bool = False
) -> List[str]:
    """
    Create safe agent instructions that prevent hallucination
    """
    if base_instructions is None:
        base_instructions = []
    
    safe_instructions = AntiHallucinationGuard.get_default_instructions()
    
    # Add knowledge source disclaimer
    disclaimer = AntiHallucinationGuard.get_knowledge_disclaimer(has_knowledge_sources)
    safe_instructions.append(f"KNOWLEDGE STATUS: {disclaimer}")
    
    # Combine with base instructions
    return safe_instructions + base_instructions


def validate_agent_configuration(agent_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate agent configuration for anti-hallucination compliance
    """
    has_knowledge = len(agent_config.get("knowledge_sources", [])) > 0
    has_safe_instructions = any(
        "fabricate" in instruction.lower() or "invent" in instruction.lower()
        for instruction in agent_config.get("instructions", [])
    )
    
    warnings = []
    if not has_knowledge:
        warnings.append("Agent has no knowledge sources - high risk of hallucination")
    
    if not has_safe_instructions:
        warnings.append("Agent lacks anti-hallucination instructions")
    
    return {
        "is_safe": len(warnings) == 0,
        "has_knowledge_sources": has_knowledge,
        "has_safe_instructions": has_safe_instructions,
        "warnings": warnings,
        "recommendations": [
            "Add knowledge sources for specific domain questions",
            "Include anti-hallucination instructions",
            "Test agent responses for accuracy"
        ] if warnings else []
    }
