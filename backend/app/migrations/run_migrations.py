"""
Migration Runner
Utility to run database migrations for Vexel
"""

import asyncio
import sys
import os
from pathlib import Path
import importlib.util
import logging
from datetime import datetime
from dotenv import load_dotenv

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MigrationRunner:
    """Utility to run database migrations"""
    
    def __init__(self):
        self.migrations_dir = Path(__file__).parent
        self.migration_history = []
    
    def discover_migrations(self) -> list:
        """Discover all migration files"""
        migration_files = []
        
        for file_path in self.migrations_dir.glob("*.py"):
            if file_path.name.startswith("00") and file_path.name != "run_migrations.py":
                migration_files.append(file_path)
        
        # Sort by filename to ensure order
        migration_files.sort()
        return migration_files
    
    async def load_migration(self, file_path: Path):
        """Load a migration module"""
        try:
            spec = importlib.util.spec_from_file_location(
                f"migration_{file_path.stem}", 
                file_path
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return module
        except Exception as e:
            logger.error(f"Failed to load migration {file_path}: {str(e)}")
            return None
    
    async def run_migration(self, file_path: Path) -> dict:
        """Run a single migration"""
        logger.info(f"Running migration: {file_path.name}")
        
        try:
            module = await self.load_migration(file_path)
            if not module:
                return {"status": "failed", "error": "Failed to load migration module"}
            
            # Check if module has run_migration function
            if hasattr(module, 'run_migration'):
                result = await module.run_migration()
                return result
            else:
                logger.error(f"Migration {file_path.name} does not have run_migration function")
                return {"status": "failed", "error": "No run_migration function found"}
                
        except Exception as e:
            error_msg = f"Migration {file_path.name} failed: {str(e)}"
            logger.error(error_msg)
            return {"status": "failed", "error": error_msg}
    
    async def run_all_migrations(self) -> dict:
        """Run all discovered migrations"""
        logger.info("Starting migration runner")
        
        migrations = self.discover_migrations()
        if not migrations:
            logger.info("No migrations found")
            return {"status": "completed", "migrations": []}
        
        logger.info(f"Found {len(migrations)} migrations")
        
        results = []
        failed_migrations = []
        
        for migration_file in migrations:
            logger.info(f"Processing migration: {migration_file.name}")
            
            result = await self.run_migration(migration_file)
            result["migration_file"] = migration_file.name
            result["timestamp"] = datetime.utcnow().isoformat()
            
            results.append(result)
            
            if result["status"] == "failed":
                failed_migrations.append(migration_file.name)
                logger.error(f"Migration {migration_file.name} failed, stopping")
                break
            else:
                logger.info(f"Migration {migration_file.name} completed successfully")
        
        overall_status = "completed" if not failed_migrations else "failed"
        
        return {
            "status": overall_status,
            "migrations": results,
            "failed_migrations": failed_migrations,
            "total_migrations": len(migrations),
            "completed_migrations": len(results) - len(failed_migrations)
        }
    
    def print_results(self, results: dict):
        """Print migration results in a formatted way"""
        print("\n" + "=" * 80)
        print("VEXEL DATABASE MIGRATION RESULTS")
        print("=" * 80)
        
        print(f"Overall Status: {results['status'].upper()}")
        print(f"Total Migrations: {results['total_migrations']}")
        print(f"Completed: {results['completed_migrations']}")
        print(f"Failed: {len(results['failed_migrations'])}")
        
        if results['migrations']:
            print("\nMigration Details:")
            print("-" * 40)
            
            for migration in results['migrations']:
                status_icon = "✅" if migration['status'] == 'completed' else "❌"
                print(f"{status_icon} {migration['migration_file']}: {migration['status']}")
                
                if migration['status'] == 'failed':
                    print(f"   Error: {migration.get('error', 'Unknown error')}")
                elif migration['status'] == 'completed' and 'migration_stats' in migration:
                    stats = migration['migration_stats']
                    print(f"   Migrated: {stats.get('migrated_users', 0)} users")
                    if stats.get('errors'):
                        print(f"   Warnings: {len(stats['errors'])} errors")
        
        if results['failed_migrations']:
            print(f"\nFailed Migrations:")
            for failed in results['failed_migrations']:
                print(f"  ❌ {failed}")
        
        print("=" * 80)


async def main():
    """Main function"""
    # Load environment variables
    load_dotenv()

    runner = MigrationRunner()

    try:
        results = await runner.run_all_migrations()
        runner.print_results(results)
        
        # Exit with appropriate code
        if results['status'] == 'completed':
            print("✅ All migrations completed successfully!")
            return 0
        else:
            print("❌ Some migrations failed!")
            return 1
            
    except Exception as e:
        logger.error(f"Migration runner failed: {str(e)}")
        print(f"❌ Migration runner failed: {str(e)}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
