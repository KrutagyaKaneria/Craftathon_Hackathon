from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.utils import logger

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    try:
        db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
        db_instance.db = db_instance.client[settings.DB_NAME]
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection.")
        db_instance.client.close()

async def insert_event(event_dict: dict):
    """
    Inserts a standardized event into the driver_events collection asynchronously.
    """
    if db_instance.db is None:
        logger.error("DB connection is not established. Cannot insert event.")
        return

    try:
        collection = db_instance.db[settings.COLLECTION_NAME]
        result = await collection.insert_one(event_dict)
        logger.info(f"Inserted event with ID: {result.inserted_id}")
    except Exception as e:
        logger.error(f"Error inserting event into MongoDB: {e}")

def get_db():
    return db_instance.db
