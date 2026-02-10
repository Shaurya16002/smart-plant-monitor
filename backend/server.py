from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import random


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Helper function to convert ObjectId to string
def plant_helper(plant) -> dict:
    return {
        "id": str(plant["_id"]),
        "name": plant["name"],
        "plant_type": plant["plant_type"],
        "location": plant.get("location", ""),
        "image": plant.get("image", ""),
        "thresholds": plant.get("thresholds", {
            "min_moisture": 30,
            "max_moisture": 70,
            "min_temp": 15,
            "max_temp": 30,
            "min_humidity": 40,
            "max_humidity": 80
        }),
        "created_at": plant.get("created_at", datetime.utcnow()).isoformat()
    }

def reading_helper(reading) -> dict:
    return {
        "id": str(reading["_id"]),
        "plant_id": str(reading["plant_id"]),
        "moisture": reading["moisture"],
        "temperature": reading["temperature"],
        "humidity": reading["humidity"],
        "timestamp": reading["timestamp"].isoformat()
    }


# Define Models
class PlantThresholds(BaseModel):
    min_moisture: float = 30
    max_moisture: float = 70
    min_temp: float = 15
    max_temp: float = 30
    min_humidity: float = 40
    max_humidity: float = 80

class PlantCreate(BaseModel):
    name: str
    plant_type: str
    location: Optional[str] = ""
    image: Optional[str] = ""
    thresholds: Optional[PlantThresholds] = PlantThresholds()

class PlantUpdate(BaseModel):
    name: Optional[str] = None
    plant_type: Optional[str] = None
    location: Optional[str] = None
    image: Optional[str] = None
    thresholds: Optional[PlantThresholds] = None

class PlantResponse(BaseModel):
    id: str
    name: str
    plant_type: str
    location: str
    image: str
    thresholds: PlantThresholds
    created_at: str

class SensorReading(BaseModel):
    plant_id: str
    moisture: float
    temperature: float
    humidity: float

class SensorReadingResponse(BaseModel):
    id: str
    plant_id: str
    moisture: float
    temperature: float
    humidity: float
    timestamp: str

class DailyReport(BaseModel):
    date: str
    avg_moisture: float
    avg_temperature: float
    avg_humidity: float
    min_moisture: float
    max_moisture: float
    min_temperature: float
    max_temperature: float
    min_humidity: float
    max_humidity: float
    reading_count: int


# Routes
@api_router.get("/")
async def root():
    return {"message": "Smart Plant Monitoring API"}


# Plant Routes
@api_router.post("/plants", response_model=PlantResponse)
async def create_plant(plant: PlantCreate):
    plant_dict = plant.dict()
    plant_dict["created_at"] = datetime.utcnow()
    
    result = await db.plants.insert_one(plant_dict)
    new_plant = await db.plants.find_one({"_id": result.inserted_id})
    
    return plant_helper(new_plant)


@api_router.get("/plants", response_model=List[PlantResponse])
async def get_plants():
    plants = await db.plants.find().to_list(100)
    return [plant_helper(plant) for plant in plants]


@api_router.get("/plants/{plant_id}", response_model=PlantResponse)
async def get_plant(plant_id: str):
    try:
        plant = await db.plants.find_one({"_id": ObjectId(plant_id)})
        if plant:
            return plant_helper(plant)
        raise HTTPException(status_code=404, detail="Plant not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.put("/plants/{plant_id}", response_model=PlantResponse)
async def update_plant(plant_id: str, plant_update: PlantUpdate):
    try:
        update_data = {k: v for k, v in plant_update.dict().items() if v is not None}
        
        if update_data:
            await db.plants.update_one(
                {"_id": ObjectId(plant_id)},
                {"$set": update_data}
            )
        
        plant = await db.plants.find_one({"_id": ObjectId(plant_id)})
        if plant:
            return plant_helper(plant)
        raise HTTPException(status_code=404, detail="Plant not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.delete("/plants/{plant_id}")
async def delete_plant(plant_id: str):
    try:
        # Delete plant
        result = await db.plants.delete_one({"_id": ObjectId(plant_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Plant not found")
        
        # Delete associated readings
        await db.sensor_readings.delete_many({"plant_id": ObjectId(plant_id)})
        
        return {"message": "Plant deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Sensor Reading Routes
@api_router.post("/readings", response_model=SensorReadingResponse)
async def add_reading(reading: SensorReading):
    try:
        reading_dict = {
            "plant_id": ObjectId(reading.plant_id),
            "moisture": reading.moisture,
            "temperature": reading.temperature,
            "humidity": reading.humidity,
            "timestamp": datetime.utcnow()
        }
        
        result = await db.sensor_readings.insert_one(reading_dict)
        new_reading = await db.sensor_readings.find_one({"_id": result.inserted_id})
        
        return reading_helper(new_reading)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.get("/readings/{plant_id}/latest", response_model=SensorReadingResponse)
async def get_latest_reading(plant_id: str):
    try:
        reading = await db.sensor_readings.find_one(
            {"plant_id": ObjectId(plant_id)},
            sort=[("timestamp", -1)]
        )
        
        if reading:
            return reading_helper(reading)
        raise HTTPException(status_code=404, detail="No readings found for this plant")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.get("/readings/{plant_id}/history", response_model=List[SensorReadingResponse])
async def get_reading_history(plant_id: str, days: int = 7):
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        readings = await db.sensor_readings.find(
            {
                "plant_id": ObjectId(plant_id),
                "timestamp": {"$gte": start_date}
            }
        ).sort("timestamp", 1).to_list(1000)
        
        return [reading_helper(reading) for reading in readings]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.get("/readings/{plant_id}/reports", response_model=List[DailyReport])
async def get_reports(plant_id: str, days: int = 7):
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "plant_id": ObjectId(plant_id),
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$timestamp"
                        }
                    },
                    "avg_moisture": {"$avg": "$moisture"},
                    "avg_temperature": {"$avg": "$temperature"},
                    "avg_humidity": {"$avg": "$humidity"},
                    "min_moisture": {"$min": "$moisture"},
                    "max_moisture": {"$max": "$moisture"},
                    "min_temperature": {"$min": "$temperature"},
                    "max_temperature": {"$max": "$temperature"},
                    "min_humidity": {"$min": "$humidity"},
                    "max_humidity": {"$max": "$humidity"},
                    "reading_count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        reports = await db.sensor_readings.aggregate(pipeline).to_list(100)
        
        return [
            DailyReport(
                date=report["_id"],
                avg_moisture=round(report["avg_moisture"], 2),
                avg_temperature=round(report["avg_temperature"], 2),
                avg_humidity=round(report["avg_humidity"], 2),
                min_moisture=round(report["min_moisture"], 2),
                max_moisture=round(report["max_moisture"], 2),
                min_temperature=round(report["min_temperature"], 2),
                max_temperature=round(report["max_temperature"], 2),
                min_humidity=round(report["min_humidity"], 2),
                max_humidity=round(report["max_humidity"], 2),
                reading_count=report["reading_count"]
            )
            for report in reports
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Simulate sensor reading (for testing without Arduino)
@api_router.post("/simulate-reading/{plant_id}", response_model=SensorReadingResponse)
async def simulate_reading(plant_id: str):
    try:
        # Verify plant exists
        plant = await db.plants.find_one({"_id": ObjectId(plant_id)})
        if not plant:
            raise HTTPException(status_code=404, detail="Plant not found")
        
        # Generate realistic sensor data
        reading_dict = {
            "plant_id": ObjectId(plant_id),
            "moisture": round(random.uniform(20, 80), 2),
            "temperature": round(random.uniform(18, 28), 2),
            "humidity": round(random.uniform(35, 75), 2),
            "timestamp": datetime.utcnow()
        }
        
        result = await db.sensor_readings.insert_one(reading_dict)
        new_reading = await db.sensor_readings.find_one({"_id": result.inserted_id})
        
        return reading_helper(new_reading)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
