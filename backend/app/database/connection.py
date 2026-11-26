
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# Local MongoDB connection URL
MONGO_URI = "mongodb://localhost:27017/"

# Create MongoDB client
client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000
)

# Select our database
database = client["ai_lead_agent"]

# Select our leads collection
leads_collection = database["leads"]


def check_database_connection():
    try:
        client.admin.command("ping")
        print("MongoDB connection successful!")
        return True

    except ConnectionFailure as error:
        print(f"MongoDB connection failed: {error}")
        return False
