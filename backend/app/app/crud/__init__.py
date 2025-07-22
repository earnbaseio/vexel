from .crud_user import user
from .crud_token import token

# Agent CRUD operations
from .crud_agent import (
    crud_agent_configuration,
    crud_agent_session,
    crud_agent_metrics
)

# Chat CRUD operations
from .crud_chat import (
    crud_chat_conversation,
    crud_message,
    crud_conversation_feedback,
    crud_conversation_template
)

# Workflow CRUD operations
from .crud_workflow import (
    crud_workflow_template,
    crud_workflow_execution,
    crud_workflow_step_execution,
    crud_workflow_schedule,
    crud_workflow_analytics
)


# For a new basic set of CRUD operations you could just do

# from .base import CRUDBase
# from app.models.item import Item
# from app.schemas.item import ItemCreate, ItemUpdate

# item = CRUDBase[Item, ItemCreate, ItemUpdate](Item)
