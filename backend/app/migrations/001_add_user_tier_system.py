"""
Migration: Add User Tier System
Adds tier-related fields to User collection and sets defaults for existing users
"""

import asyncio
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import UpdateOne
import logging

logger = logging.getLogger(__name__)


class UserTierMigration:
    """Migration to add user tier system to existing users"""
    
    def __init__(self, mongodb_url: str = None):
        self.mongodb_url = mongodb_url or os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self.db_name = os.getenv("MONGO_DATABASE", "vexel")
        self.client = None
        self.db = None
    
    async def connect(self):
        """Connect to MongoDB"""
        self.client = AsyncIOMotorClient(self.mongodb_url)
        self.db = self.client[self.db_name]
        logger.info(f"Connected to MongoDB: {self.mongodb_url}")
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def check_migration_needed(self) -> bool:
        """Check if migration is needed by looking for users without tier field"""
        users_without_tier = await self.db.user.count_documents({"tier": {"$exists": False}})
        total_users = await self.db.user.count_documents({})

        logger.info(f"Found {users_without_tier} users without tier field out of {total_users} total users")
        return users_without_tier > 0
    
    async def backup_users(self) -> str:
        """Create backup of users collection before migration"""
        backup_collection = f"users_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Copy all users to backup collection
        users = []
        async for user in self.db.user.find({}):
            users.append(user)
        
        if users:
            await self.db[backup_collection].insert_many(users)
            logger.info(f"Created backup collection: {backup_collection} with {len(users)} users")
        
        return backup_collection
    
    async def migrate_users(self) -> dict:
        """Migrate existing users to add tier system fields"""
        migration_stats = {
            "total_users": 0,
            "migrated_users": 0,
            "skipped_users": 0,
            "errors": []
        }
        
        # Get current timestamp
        now = datetime.utcnow()
        
        # Find users that need migration
        users_to_migrate = []
        async for user in self.db.user.find({"tier": {"$exists": False}}):
            users_to_migrate.append(user)
        
        migration_stats["total_users"] = len(users_to_migrate)
        
        if not users_to_migrate:
            logger.info("No users need migration")
            return migration_stats
        
        # Prepare bulk update operations
        bulk_operations = []
        
        for user in users_to_migrate:
            try:
                # Determine initial tier based on user characteristics
                initial_tier = self._determine_initial_tier(user)
                
                # Prepare update operation
                update_doc = {
                    "$set": {
                        "tier": initial_tier,
                        "tier_updated_at": now,
                        "monthly_uploads": 0,
                        "monthly_reset_date": now,
                        "total_storage_bytes": 0,
                        "advanced_chunking_enabled": initial_tier != "free",
                        "parallel_processing_enabled": initial_tier == "enterprise",
                        "analytics_enabled": initial_tier in ["premium", "enterprise"]
                    }
                }
                
                bulk_operations.append(
                    UpdateOne({"_id": user["_id"]}, update_doc)
                )
                
                migration_stats["migrated_users"] += 1
                
            except Exception as e:
                error_msg = f"Error preparing migration for user {user.get('_id', 'unknown')}: {str(e)}"
                logger.error(error_msg)
                migration_stats["errors"].append(error_msg)
                migration_stats["skipped_users"] += 1
        
        # Execute bulk operations
        if bulk_operations:
            try:
                result = await self.db.user.bulk_write(bulk_operations)
                logger.info(f"Bulk update completed: {result.modified_count} users updated")
                
                # Verify migration
                await self._verify_migration()
                
            except Exception as e:
                error_msg = f"Bulk update failed: {str(e)}"
                logger.error(error_msg)
                migration_stats["errors"].append(error_msg)
        
        return migration_stats
    
    def _determine_initial_tier(self, user: dict) -> str:
        """Determine initial tier for existing user based on characteristics"""
        
        # Check if user is superuser
        if user.get("is_superuser", False):
            return "enterprise"
        
        # Check if user has been active (has uploaded files, etc.)
        # For now, we'll set most users to free tier
        # In a real scenario, you might check usage patterns, payment history, etc.
        
        # Check email domain for enterprise users (example logic)
        email = user.get("email", "")
        enterprise_domains = ["company.com", "enterprise.org"]  # Add your enterprise domains
        
        if any(domain in email for domain in enterprise_domains):
            return "enterprise"
        
        # Check if user has been very active (example: created recently might be premium trial)
        created_date = user.get("created")
        if created_date and isinstance(created_date, datetime):
            days_since_creation = (datetime.utcnow() - created_date).days
            if days_since_creation < 30:  # Recent users get premium trial
                return "premium"
        
        # Default to free tier
        return "free"
    
    async def _verify_migration(self):
        """Verify that migration was successful"""
        users_without_tier = await self.db.user.count_documents({"tier": {"$exists": False}})
        users_with_tier = await self.db.user.count_documents({"tier": {"$exists": True}})
        
        logger.info(f"Migration verification: {users_with_tier} users with tier, {users_without_tier} without tier")
        
        if users_without_tier > 0:
            logger.warning(f"Migration incomplete: {users_without_tier} users still missing tier field")
        else:
            logger.info("Migration verification successful: All users have tier field")
    
    async def create_indexes(self):
        """Create indexes for new tier-related fields"""
        indexes_to_create = [
            ("tier", 1),
            ("monthly_uploads", 1),
            ("total_storage_bytes", 1),
            ("tier_updated_at", 1),
            ("monthly_reset_date", 1)
        ]
        
        for field, direction in indexes_to_create:
            try:
                await self.db.user.create_index([(field, direction)])
                logger.info(f"Created index on user.{field}")
            except Exception as e:
                logger.warning(f"Failed to create index on user.{field}: {str(e)}")
    
    async def run_migration(self, create_backup: bool = True) -> dict:
        """Run the complete migration process"""
        logger.info("Starting User Tier System migration")
        
        try:
            await self.connect()
            
            # Check if migration is needed
            if not await self.check_migration_needed():
                logger.info("Migration not needed - all users already have tier field")
                return {"status": "skipped", "reason": "Migration not needed"}
            
            # Create backup if requested
            backup_collection = None
            if create_backup:
                backup_collection = await self.backup_users()
            
            # Run migration
            migration_stats = await self.migrate_users()
            
            # Create indexes
            await self.create_indexes()
            
            # Final verification
            await self._verify_migration()
            
            result = {
                "status": "completed",
                "backup_collection": backup_collection,
                "migration_stats": migration_stats,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Migration completed successfully: {migration_stats}")
            return result
            
        except Exception as e:
            error_msg = f"Migration failed: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "failed",
                "error": error_msg,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        finally:
            await self.disconnect()


async def run_migration():
    """Main function to run the migration"""
    migration = UserTierMigration()
    result = await migration.run_migration(create_backup=True)
    
    print("=" * 60)
    print("USER TIER SYSTEM MIGRATION RESULTS")
    print("=" * 60)
    print(f"Status: {result['status']}")
    
    if result['status'] == 'completed':
        stats = result['migration_stats']
        print(f"Total users: {stats['total_users']}")
        print(f"Migrated users: {stats['migrated_users']}")
        print(f"Skipped users: {stats['skipped_users']}")
        print(f"Errors: {len(stats['errors'])}")
        
        if stats['errors']:
            print("\nErrors encountered:")
            for error in stats['errors']:
                print(f"  - {error}")
        
        if result['backup_collection']:
            print(f"\nBackup created: {result['backup_collection']}")
    
    elif result['status'] == 'failed':
        print(f"Error: {result['error']}")
    
    print("=" * 60)
    return result


if __name__ == "__main__":
    # Run migration
    result = asyncio.run(run_migration())
    
    # Exit with appropriate code
    if result['status'] == 'completed':
        exit(0)
    else:
        exit(1)
