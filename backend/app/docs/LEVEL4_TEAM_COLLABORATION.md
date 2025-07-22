# Vexel Level 4: Team Collaboration System

## Overview

Vexel Level 4 implements advanced team collaboration capabilities using Agno's multi-agent framework. This system enables multiple AI agents to work together in coordinated teams to solve complex problems through specialized roles and collaborative workflows.

## Key Features

### 🤝 Multi-Agent Teams
- **Specialized Agents**: Research, Analysis, Communication, and Coordination agents
- **Role-Based Expertise**: Each agent has specific tools and capabilities
- **Shared Memory**: Team-wide memory and context sharing
- **Persistent Storage**: Team sessions and collaboration history

### 🎯 Collaboration Modes

#### 1. **Route Mode**
- Routes tasks to the most appropriate specialist agent
- Ideal for clear, single-domain tasks
- Efficient task delegation based on agent expertise

#### 2. **Coordinate Mode** 
- Team leader orchestrates collaboration between specialists
- Breaks down complex tasks into subtasks
- Synthesizes results from multiple agents
- Best for complex, multi-step problems

#### 3. **Collaborate Mode**
- All agents discuss and reach consensus
- Democratic decision-making process
- Comprehensive perspective integration
- Ideal for strategic planning and analysis

### 🧠 Advanced Capabilities
- **Agentic Memory Management**: Teams can create and update memories
- **Session Summaries**: Automatic conversation summarization
- **Knowledge Integration**: Shared knowledge bases with Gemini embeddings
- **Context Awareness**: Persistent context across team interactions
- **Performance Monitoring**: Success criteria and completion tracking

## Architecture

### Core Components

```python
VexelTeamCollaboration(
    team_name="VexelTeam",
    mode="coordinate",  # route, coordinate, collaborate
    leader_model="gemini/gemini-1.5-flash",
    user_id="user_123",
    knowledge_sources=[...],
    qdrant_url="http://localhost:6333"
)
```

### Specialized Agents

#### 1. **Research Agent**
- **Role**: Information gathering and analysis
- **Tools**: DuckDuckGo search, web scraping
- **Expertise**: Finding accurate, up-to-date information
- **Output**: Comprehensive research summaries with citations

#### 2. **Analysis Agent**
- **Role**: Data analysis and reasoning
- **Tools**: Reasoning tools (think, analyze)
- **Expertise**: Problem-solving and insight generation
- **Output**: Structured analysis with logical conclusions

#### 3. **Communication Agent**
- **Role**: Synthesis and presentation
- **Tools**: Content formatting and structuring
- **Expertise**: Clear, engaging communication
- **Output**: Well-structured reports and presentations

#### 4. **Coordination Agent**
- **Role**: Task management and workflow optimization
- **Tools**: Reasoning tools for planning
- **Expertise**: Team efficiency and coordination
- **Output**: Task assignments and workflow recommendations

## API Endpoints

### Team Collaboration

#### `POST /api/v1/agents/team-collaboration/run`
Execute a task using team collaboration system.

**Request:**
```json
{
  "team_name": "VexelTeam",
  "mode": "coordinate",
  "leader_model": "gemini/gemini-1.5-flash",
  "user_id": "user_123",
  "task": "Analyze market trends and provide recommendations",
  "knowledge_sources": [
    {
      "type": "text",
      "name": "market_data",
      "content": ["Market analysis data..."]
    }
  ],
  "success_criteria": "Comprehensive analysis with actionable recommendations",
  "custom_instructions": ["Focus on data-driven insights"]
}
```

**Response:**
```json
{
  "message": "Team collaboration task completed",
  "response": "Detailed team response...",
  "team_info": {
    "team_name": "VexelTeam",
    "mode": "coordinate",
    "agents": {...},
    "knowledge_bases": 1
  },
  "context": {
    "memories_count": 5,
    "recent_memories": [...],
    "session_summary": "..."
  },
  "status": "success"
}
```

### Specialized Teams

#### `POST /api/v1/agents/team-collaboration/create-research-team`
Create and run a research-focused team.

#### `POST /api/v1/agents/team-collaboration/create-analysis-team`
Create and run an analysis-focused team.

#### `POST /api/v1/agents/team-collaboration/create-routing-team`
Create and run a routing team for task delegation.

### Team Management

#### `GET /api/v1/agents/team-collaboration/team-info/{team_name}`
Get comprehensive team information and status.

#### `DELETE /api/v1/agents/team-collaboration/memories/{team_name}`
Clear all team memories (for testing).

#### `POST /api/v1/agents/team-collaboration/test`
Test team collaboration system functionality.

## Usage Examples

### Basic Team Collaboration

```python
from app.agents.team_collaboration import VexelTeamCollaboration

# Create team system
team = VexelTeamCollaboration(
    team_name="ProjectTeam",
    mode="coordinate",
    user_id="user_123"
)

# Execute task
response = team.run_team_task(
    "Research and analyze the benefits of AI in healthcare"
)

print(response)
```

### Research Team

```python
from app.agents.team_collaboration import create_research_team

# Create specialized research team
research_team = create_research_team(
    team_name="HealthcareResearch",
    user_id="researcher_456",
    knowledge_sources=[{
        "type": "text",
        "name": "healthcare_data",
        "content": ["Healthcare AI research papers..."]
    }]
)

# Execute research task
result = research_team.run_team_task(
    "Find the latest developments in AI-powered diagnostic tools"
)
```

### Async Collaboration

```python
import asyncio

async def run_async_team():
    team = VexelTeamCollaboration(
        team_name="AsyncTeam",
        mode="collaborate"
    )
    
    response = await team.arun_team_task(
        "Analyze market opportunities for AI products"
    )
    
    return response

result = asyncio.run(run_async_team())
```

## Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
QDRANT_URL=http://localhost:6333
```

### Database Setup

The system uses SQLite for persistent storage:

- **Team Sessions**: `vexel_team_sessions` table
- **Team Memories**: `vexel_team_memories` table
- **Knowledge Storage**: Qdrant vector database

### Knowledge Sources

```python
knowledge_sources = [
    {
        "type": "text",
        "name": "domain_knowledge",
        "content": [
            "Domain-specific information...",
            "Expert insights and data...",
            "Historical context and trends..."
        ]
    }
]
```

## Performance Considerations

### Optimization Tips

1. **Knowledge Base Size**: Limit knowledge content for faster processing
2. **Team Size**: 4 specialized agents provide optimal balance
3. **Model Selection**: Use appropriate models for different tasks
4. **Memory Management**: Regular cleanup of old memories
5. **Async Operations**: Use async methods for better performance

### Monitoring

- **Success Criteria**: Define clear completion conditions
- **Response Times**: Monitor team coordination overhead
- **Memory Usage**: Track memory creation and retrieval
- **Agent Performance**: Monitor individual agent contributions

## Testing

### Unit Tests

```bash
# Run team collaboration tests
python test_team_collaboration.py
```

### API Tests

```bash
# Test basic functionality
curl -X POST "http://localhost:8000/api/v1/agents/team-collaboration/test"

# Test research team
curl -X POST "http://localhost:8000/api/v1/agents/team-collaboration/create-research-team" \
  -H "Content-Type: application/json" \
  -d '{"task": "Research AI trends", "user_id": "test_user"}'
```

## Troubleshooting

### Common Issues

1. **Knowledge Loading Fails**: Check Qdrant connection and Gemini API key
2. **Team Creation Errors**: Verify all required dependencies are installed
3. **Memory Issues**: Clear old memories or increase database limits
4. **API Timeouts**: Increase timeout limits for complex tasks

### Debug Mode

Enable debug mode for detailed logging:

```python
team = VexelTeamCollaboration(
    team_name="DebugTeam",
    mode="coordinate",
    debug_mode=True
)
```

## Next Steps

Level 4 Team Collaboration provides the foundation for:

- **Level 5: Agentic Workflows** - Autonomous workflow execution
- **Advanced Team Strategies** - Custom collaboration patterns
- **Enterprise Integration** - Production-ready team systems
- **Performance Optimization** - Scalable multi-agent architectures
