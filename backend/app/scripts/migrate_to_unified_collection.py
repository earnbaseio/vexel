#!/usr/bin/env python3
"""
Migration Script: Per-File Collections to Unified Collection
Migrates existing per-file Qdrant collections to a single unified collection for cross-file search
"""

import asyncio
import sys
import os
from typing import List, Dict, Any
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import settings
from app.agents.cross_file_knowledge import VexelKnowledgeMigration
from app.core.database import get_database
from agno.vectordb.qdrant import Qdrant
from agno.embedder.gemini import GeminiEmbedder
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue


class UnifiedCollectionMigrator:
    """
    Handles migration from per-file collections to unified collection
    """
    
    def __init__(self):
        self.unified_collection_name = "vexel_knowledge_base"
        self.embedder = GeminiEmbedder(model="text-embedding-004")
        self.qdrant_client = QdrantClient(url=settings.QDRANT_URL)
        self.migration_handler = VexelKnowledgeMigration()
        
    async def get_all_user_collections(self) -> List[Dict[str, Any]]:
        """
        Get all existing user collections from MongoDB metadata
        """
        db = await get_database()
        file_metadata_collection = db["file_metadata"]
        
        # Get all file metadata records
        cursor = file_metadata_collection.find({})
        collections_info = []
        
        async for record in cursor:
            collections_info.append({
                "user_id": record["user_id"],
                "file_id": record.get("file_id", f"file_{record['filename']}_{record['user_id']}"),
                "collection_name": record["collection_name"],
                "filename": record["filename"],
                "file_type": record.get("file_type", "unknown"),
                "upload_timestamp": record.get("upload_timestamp")
            })
        
        return collections_info
    
    def get_existing_qdrant_collections(self) -> List[str]:
        """
        Get all existing collections from Qdrant
        """
        try:
            collections_response = self.qdrant_client.get_collections()
            collection_names = [col.name for col in collections_response.collections]
            
            # Filter for user upload collections
            user_collections = [
                name for name in collection_names 
                if name.startswith("uploaded_")
            ]
            
            return user_collections
        except Exception as e:
            print(f"❌ Error getting Qdrant collections: {e}")
            return []
    
    async def create_unified_collection(self):
        """
        Create the unified collection if it doesn't exist
        """
        try:
            unified_vector_db = Qdrant(
                collection=self.unified_collection_name,
                url=settings.QDRANT_URL,
                embedder=self.embedder
            )
            
            if not unified_vector_db.exists():
                print(f"🔄 Creating unified collection: {self.unified_collection_name}")
                unified_vector_db.create()
                print(f"✅ Created unified collection: {self.unified_collection_name}")
            else:
                print(f"ℹ️ Unified collection already exists: {self.unified_collection_name}")
                
        except Exception as e:
            print(f"❌ Error creating unified collection: {e}")
            raise
    
    async def migrate_collection(self, collection_info: Dict[str, Any]) -> bool:
        """
        Migrate a single collection to unified collection
        """
        collection_name = collection_info["collection_name"]
        user_id = collection_info["user_id"]
        
        try:
            print(f"🔄 Migrating collection: {collection_name}")
            
            # Check if source collection exists in Qdrant
            if not self.qdrant_client.collection_exists(collection_name):
                print(f"⚠️ Collection {collection_name} does not exist in Qdrant, skipping")
                return False
            
            # Get collection info
            collection_info_response = self.qdrant_client.get_collection(collection_name)
            points_count = collection_info_response.points_count
            
            if points_count == 0:
                print(f"⚠️ Collection {collection_name} is empty, skipping")
                return True
            
            # Migrate using the migration handler
            await self.migration_handler.migrate_user_collections_to_unified(
                user_id=user_id,
                collection_names=[collection_name]
            )
            
            print(f"✅ Successfully migrated {collection_name} ({points_count} points)")
            return True
            
        except Exception as e:
            print(f"❌ Error migrating collection {collection_name}: {e}")
            return False
    
    async def verify_migration(self, original_collections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Verify that migration was successful
        """
        print("\n🔍 Verifying migration...")
        
        # Check unified collection exists and has data
        unified_vector_db = Qdrant(
            collection=self.unified_collection_name,
            url=settings.QDRANT_URL,
            embedder=self.embedder
        )
        
        if not unified_vector_db.exists():
            return {"success": False, "error": "Unified collection does not exist"}
        
        unified_count = unified_vector_db.get_count()
        
        # Calculate expected count from original collections
        expected_count = 0
        for collection_info in original_collections:
            collection_name = collection_info["collection_name"]
            try:
                if self.qdrant_client.collection_exists(collection_name):
                    collection_info_response = self.qdrant_client.get_collection(collection_name)
                    expected_count += collection_info_response.points_count
            except Exception as e:
                print(f"⚠️ Could not get count for {collection_name}: {e}")
        
        # Verify user data isolation
        user_counts = {}
        for collection_info in original_collections:
            user_id = collection_info["user_id"]
            if user_id not in user_counts:
                # Count points for this user in unified collection
                try:
                    scroll_result = self.qdrant_client.scroll(
                        collection_name=self.unified_collection_name,
                        scroll_filter=Filter(
                            must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
                        ),
                        limit=1,
                        with_payload=False
                    )
                    
                    # Get total count for user
                    count_result = self.qdrant_client.count(
                        collection_name=self.unified_collection_name,
                        count_filter=Filter(
                            must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
                        ),
                        exact=True
                    )
                    user_counts[user_id] = count_result.count
                except Exception as e:
                    print(f"⚠️ Could not count points for user {user_id}: {e}")
                    user_counts[user_id] = 0
        
        verification_result = {
            "success": True,
            "unified_collection_count": unified_count,
            "expected_count": expected_count,
            "user_counts": user_counts,
            "collections_migrated": len(original_collections)
        }
        
        print(f"✅ Unified collection has {unified_count} points")
        print(f"📊 Expected approximately {expected_count} points")
        print(f"👥 Data for {len(user_counts)} users")
        
        return verification_result
    
    async def cleanup_old_collections(self, collections_to_cleanup: List[str], confirm: bool = False):
        """
        Clean up old collections after successful migration
        """
        if not confirm:
            print("\n⚠️ Cleanup not confirmed. Use --cleanup flag to remove old collections.")
            return
        
        print(f"\n🗑️ Cleaning up {len(collections_to_cleanup)} old collections...")
        
        for collection_name in collections_to_cleanup:
            try:
                if self.qdrant_client.collection_exists(collection_name):
                    self.qdrant_client.delete_collection(collection_name)
                    print(f"🗑️ Deleted collection: {collection_name}")
                else:
                    print(f"⚠️ Collection {collection_name} already deleted")
            except Exception as e:
                print(f"❌ Error deleting collection {collection_name}: {e}")
    
    async def run_migration(self, cleanup: bool = False, dry_run: bool = False):
        """
        Run the complete migration process
        """
        print("🚀 Starting migration from per-file collections to unified collection")
        print(f"🎯 Target unified collection: {self.unified_collection_name}")
        
        if dry_run:
            print("🔍 DRY RUN MODE - No actual changes will be made")
        
        # Step 1: Get all user collections
        print("\n📋 Step 1: Getting all user collections...")
        collections_info = await self.get_all_user_collections()
        qdrant_collections = self.get_existing_qdrant_collections()
        
        print(f"📊 Found {len(collections_info)} collections in metadata")
        print(f"📊 Found {len(qdrant_collections)} upload collections in Qdrant")
        
        # Filter to only collections that exist in both metadata and Qdrant
        valid_collections = [
            info for info in collections_info 
            if info["collection_name"] in qdrant_collections
        ]
        
        print(f"✅ {len(valid_collections)} collections ready for migration")
        
        if dry_run:
            print("\n📋 Collections that would be migrated:")
            for info in valid_collections:
                print(f"  - {info['collection_name']} (user: {info['user_id']}, file: {info['filename']})")
            return
        
        # Step 2: Create unified collection
        print("\n🏗️ Step 2: Creating unified collection...")
        await self.create_unified_collection()
        
        # Step 3: Migrate collections
        print(f"\n🔄 Step 3: Migrating {len(valid_collections)} collections...")
        successful_migrations = []
        failed_migrations = []
        
        for i, collection_info in enumerate(valid_collections, 1):
            print(f"\n[{i}/{len(valid_collections)}] Migrating {collection_info['collection_name']}")
            
            success = await self.migrate_collection(collection_info)
            if success:
                successful_migrations.append(collection_info["collection_name"])
            else:
                failed_migrations.append(collection_info["collection_name"])
        
        # Step 4: Verify migration
        print(f"\n✅ Migration completed: {len(successful_migrations)} successful, {len(failed_migrations)} failed")
        
        if failed_migrations:
            print("❌ Failed migrations:")
            for collection_name in failed_migrations:
                print(f"  - {collection_name}")
        
        verification_result = await self.verify_migration(valid_collections)
        
        # Step 5: Cleanup (optional)
        if cleanup and successful_migrations:
            await self.cleanup_old_collections(successful_migrations, confirm=True)
        
        print("\n🎉 Migration process completed!")
        return verification_result


async def main():
    """
    Main migration function
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Migrate per-file collections to unified collection")
    parser.add_argument("--cleanup", action="store_true", help="Delete old collections after migration")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be migrated without making changes")
    
    args = parser.parse_args()
    
    migrator = UnifiedCollectionMigrator()
    
    try:
        result = await migrator.run_migration(cleanup=args.cleanup, dry_run=args.dry_run)
        
        if not args.dry_run:
            print(f"\n📊 Migration Summary:")
            print(f"  - Unified collection points: {result['unified_collection_count']}")
            print(f"  - Collections migrated: {result['collections_migrated']}")
            print(f"  - Users affected: {len(result['user_counts'])}")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
