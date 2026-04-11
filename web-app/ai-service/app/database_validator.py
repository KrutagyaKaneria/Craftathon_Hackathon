"""
Database Validation Utility for AI-Service
Ensures MongoDB is ready and collections are writable before allowing sessions
Prevents silent failures from misconfigured collections or full database
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.utils import logger
from app.config import settings


class DatabaseValidator:
    """Validates database setup and writability"""

    def __init__(self, db_client: AsyncIOMotorClient = None, db: AsyncIOMotorDatabase = None):
        """
        Initialize validator with database connection
        
        Args:
            db_client: Motor AsyncIO MongoDB client
            db: Motor AsyncIO database instance
        """
        self.client = db_client
        self.db = db
        self.validation_result = None

    async def validate_database_setup(self) -> dict:
        """
        Comprehensive database validation
        Checks connection, collections, writability, and storage
        
        Returns:
            dict: Validation result with status, errors, warnings
        """
        logger.info("🔍 Starting comprehensive database validation...\n")
        
        errors = []
        warnings = []
        successful = []

        try:
            # Step 1: Verify connection
            logger.info("1️⃣  Testing MongoDB connection...")
            if self.db is None:
                errors.append("❌ MongoDB database instance not initialized")
                logger.error("   ❌ Database not initialized")
                return {
                    "success": False,
                    "errors": errors,
                    "warnings": warnings,
                    "successful": successful,
                    "is_ready_for_sessions": False,
                }

            try:
                # Ping the database
                result = await self.db.command("ping")
                if result.get("ok") == 1:
                    successful.append("✅ Connected to MongoDB")
                    logger.info("   ✅ Connected")
                else:
                    errors.append("❌ Database ping failed")
                    logger.error("   ❌ Ping failed")
            except Exception as ping_error:
                errors.append(f"❌ Failed to ping database: {str(ping_error)}")
                logger.error(f"   ❌ Ping error: {ping_error}")

            # Step 2: Verify database and collection name configuration
            logger.info("\n2️⃣  Verifying database and collection configuration...")
            if not settings.COLLECTION_NAME:
                errors.append("❌ COLLECTION_NAME not configured in .env")
                logger.error("   ❌ COLLECTION_NAME missing from config")
            else:
                logger.info(f"   Collection: {settings.COLLECTION_NAME}")
                successful.append(f"✅ Collection name configured: {settings.COLLECTION_NAME}")

            # Step 3: List existing collections
            logger.info("\n3️⃣  Checking for required collections...")
            try:
                collections = await self.db.list_collection_names()
                logger.info(f"   Found {len(collections)} existing collection(s)")
                
                if settings.COLLECTION_NAME not in collections:
                    warnings.append(
                        f"⚠️  Collection '{settings.COLLECTION_NAME}' does not exist yet "
                        f"(will be created upon first event insert)"
                    )
                    logger.info(f"   ⚠️  {settings.COLLECTION_NAME} - Will be created on first write")
                else:
                    successful.append(f"✅ Collection '{settings.COLLECTION_NAME}' exists")
                    logger.info(f"   ✅ {settings.COLLECTION_NAME} - Exists")
            except Exception as list_error:
                errors.append(f"❌ Could not list collections: {str(list_error)}")
                logger.error(f"   ❌ Error listing collections: {list_error}")

            # Step 4: Test write permissions
            logger.info("\n4️⃣  Testing write permissions...")
            try:
                collection = self.db[settings.COLLECTION_NAME]
                
                # Insert test document
                test_doc = {
                    "__test_write__": True,
                    "timestamp": asyncio.get_event_loop().time(),
                }
                result = await collection.insert_one(test_doc)
                test_id = result.inserted_id
                logger.info(f"   Inserted test document: {test_id}")
                
                # Delete test document
                await collection.delete_one({"_id": test_id})
                logger.info("   Deleted test document")
                
                successful.append(f"✅ Write test successful for '{settings.COLLECTION_NAME}'")
                logger.info(f"   ✅ {settings.COLLECTION_NAME} - Write OK")
            except Exception as write_error:
                errors.append(
                    f"❌ Cannot write to collection '{settings.COLLECTION_NAME}': "
                    f"{str(write_error)}"
                )
                logger.error(f"   ❌ Write failed: {write_error}")

            # Step 5: Check for indexes
            logger.info("\n5️⃣  Checking collection indexes...")
            try:
                collection = self.db[settings.COLLECTION_NAME]
                indexes = await collection.list_indexes().to_list(None)
                
                if len(indexes) > 1:  # More than just _id
                    successful.append(f"✅ Collection has {len(indexes)} index(es)")
                    logger.info(f"   ✅ Indexes found: {len(indexes)}")
                else:
                    warnings.append("⚠️  Collection has no custom indexes (only default _id)")
                    logger.info("   ⚠️  No custom indexes")
            except Exception as index_error:
                warnings.append(f"⚠️  Could not check indexes: {str(index_error)}")
                logger.warning(f"   ⚠️  Index check error: {index_error}")

            # Step 6: Check database storage stats
            logger.info("\n6️⃣  Checking database storage...")
            try:
                db_stats = await self.db.command("dbstats")
                
                storage_mb = db_stats.get("storageSize", 0) / (1024 * 1024)
                data_mb = db_stats.get("dataSize", 0) / (1024 * 1024)
                collections_count = db_stats.get("collections", 0)
                
                logger.info(f"   Storage: {storage_mb:.2f} MB")
                logger.info(f"   Data: {data_mb:.2f} MB")
                logger.info(f"   Collections: {collections_count}")
                
                successful.append(f"✅ Storage: {storage_mb:.2f} MB used")
                
                # Warn if approaching typical limits
                if storage_mb > 4000:  # 4GB warning
                    warnings.append(
                        f"⚠️  Database storage is {storage_mb:.2f} MB. "
                        f"Consider cleanup if approaching limits."
                    )
                    logger.warning(f"   ⚠️  High storage usage: {storage_mb:.2f} MB")
                    
            except Exception as stats_error:
                warnings.append(f"⚠️  Could not retrieve storage stats: {str(stats_error)}")
                logger.warning(f"   ⚠️  Stats error: {stats_error}")

        except Exception as error:
            errors.append(f"❌ Unexpected validation error: {str(error)}")
            logger.error(f"   ❌ Unexpected error: {error}")

        # Summary
        logger.info("\n" + "=" * 60)
        logger.info("📊 VALIDATION SUMMARY")
        logger.info("=" * 60)
        logger.info(f"✅ Successful: {len(successful)}")
        logger.info(f"⚠️  Warnings: {len(warnings)}")
        logger.info(f"❌ Errors: {len(errors)}")

        if successful:
            logger.info("\n✅ Successful Checks:")
            for msg in successful:
                logger.info(f"   {msg}")

        if warnings:
            logger.info("\n⚠️  Warnings:")
            for msg in warnings:
                logger.info(f"   {msg}")

        if errors:
            logger.info("\n❌ Errors:")
            for msg in errors:
                logger.info(f"   {msg}")

        logger.info("=" * 60 + "\n")

        self.validation_result = {
            "success": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "successful": successful,
            "is_ready_for_sessions": len(errors) == 0,  # Strict: no sessions without passing all checks
        }

        return self.validation_result

    async def is_database_ready_for_sessions(self) -> bool:
        """
        Quick check: Is database ready to accept sessions?
        Returns True only if database passed validation
        
        Returns:
            bool: True if database is ready and writable
        """
        if self.db is None:
            logger.error("❌ Database not initialized")
            return False

        try:
            # Quick health check: Can we write?
            health_collection = self.db["_health_check"]
            test_id = f"health_check_{asyncio.get_event_loop().time()}"

            result = await health_collection.update_one(
                {"_id": test_id},
                {"$set": {"timestamp": asyncio.get_event_loop().time()}},
                upsert=True
            )

            # Clean up
            await health_collection.delete_one({"_id": test_id})

            return result.acknowledged is True
        except Exception as error:
            logger.error(f"❌ Database health check failed: {error}")
            return False

    async def get_database_diagnostics(self) -> dict:
        """
        Get diagnostic information about database
        Useful for monitoring and troubleshooting
        
        Returns:
            dict: Diagnostic information
        """
        diagnostics = {
            "db_name": None,
            "collections_count": 0,
            "storage_mb": 0,
            "data_mb": 0,
            "errors": [],
        }

        try:
            if self.db is None:
                diagnostics["errors"].append("Database not initialized")
                return diagnostics

            # Database name
            diagnostics["db_name"] = self.db.name

            # Collection count
            try:
                collections = await self.db.list_collection_names()
                diagnostics["collections_count"] = len(collections)
            except Exception as e:
                diagnostics["errors"].append(f"Could not list collections: {str(e)}")

            # Storage stats
            try:
                db_stats = await self.db.command("dbstats")
                diagnostics["storage_mb"] = db_stats.get("storageSize", 0) / (1024 * 1024)
                diagnostics["data_mb"] = db_stats.get("dataSize", 0) / (1024 * 1024)
            except Exception as e:
                diagnostics["errors"].append(f"Could not get storage stats: {str(e)}")

        except Exception as error:
            diagnostics["errors"].append(f"Unexpected diagnostics error: {str(error)}")
            logger.error(f"Diagnostics error: {error}")

        return diagnostics


# Convenience functions for use throughout AI-service

async def validate_db_on_startup(db_client: AsyncIOMotorClient, db: AsyncIOMotorDatabase) -> bool:
    """
    Validate database during application startup
    Fails startup if database validation fails
    
    Args:
        db_client: Motor AsyncIO client
        db: Motor AsyncIO database
        
    Returns:
        bool: True if validation passed
    """
    validator = DatabaseValidator(db_client, db)
    result = await validator.validate_database_setup()
    
    if not result["is_ready_for_sessions"]:
        logger.error("🛑 DATABASE VALIDATION FAILED")
        logger.error("❌ Application will not start without a valid database")
        raise RuntimeError(
            "Database validation failed. Please check MongoDB connection and configuration."
        )

    logger.info("✅ DATABASE VALIDATION PASSED")
    logger.info("✅ Application ready to accept sessions")
    return True