#!/usr/bin/env python3
"""
Fix Agent Schema - Add missing fields to existing agents
"""

import asyncio
import sys
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent.parent
sys.path.insert(0, str(app_dir))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


async def fix_agent_schema():
    """Fix agent schema by adding missing fields to existing documents"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGO_DATABASE_URI)
    db = client[settings.MONGO_DATABASE]
    collection = db["agent_configuration"]
    
    print("🔍 Checking for agents with missing fields...")
    
    # Find agents missing knowledge_sources field
    agents_missing_fields = await collection.find({
        "knowledge_sources": {"$exists": False}
    }).to_list(None)
    
    print(f"📊 Found {len(agents_missing_fields)} agents missing knowledge_sources field")
    
    if not agents_missing_fields:
        print("✅ All agents have proper schema!")
        return
    
    # Update each agent with missing fields
    updated_count = 0
    for agent in agents_missing_fields:
        agent_id = agent["_id"]
        print(f"🔧 Fixing agent {agent_id}...")
        
        # Add missing fields with default values
        update_fields = {}
        
        if "knowledge_sources" not in agent:
            update_fields["knowledge_sources"] = []
            
        if "workflow_steps" not in agent:
            update_fields["workflow_steps"] = []
            
        if "team_members" not in agent:
            update_fields["team_members"] = []
            
        if "tags" not in agent:
            update_fields["tags"] = []
        
        # Update the document
        result = await collection.update_one(
            {"_id": agent_id},
            {"$set": update_fields}
        )
        
        if result.modified_count > 0:
            updated_count += 1
            print(f"✅ Updated agent {agent_id}")
        else:
            print(f"⚠️ Failed to update agent {agent_id}")
    
    print(f"🎉 Successfully updated {updated_count} agents!")
    
    # Verify the fix
    remaining_broken = await collection.find({
        "knowledge_sources": {"$exists": False}
    }).to_list(None)
    
    if remaining_broken:
        print(f"❌ Still have {len(remaining_broken)} agents with missing fields")
    else:
        print("✅ All agents now have proper schema!")
    
    client.close()


async def main():
    """Main function"""
    print("🚀 Starting Agent Schema Fix...")
    try:
        await fix_agent_schema()
        print("✅ Schema fix completed successfully!")
    except Exception as e:
        print(f"❌ Error during schema fix: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
