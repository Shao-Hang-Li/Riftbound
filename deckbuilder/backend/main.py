from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import base64
from PIL import Image
import io
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Riftbound Deck Builder", version="1.0.0")

# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.deckbuilder
cards_collection = db.cards

class CardModel(BaseModel):
    name: str
    image_data: str  # Base64 encoded image
    card_type: str
    description: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Riftbound Deck Builder Backend"}

@app.post("/upload-card")
async def upload_card(card: CardModel):
    """Save a card with image to MongoDB"""
    try:
        # Store the card in MongoDB
        result = await cards_collection.insert_one(card.dict())
        return {"message": "Card saved successfully", "id": str(result.inserted_id)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/cards")
async def get_cards():
    """Get all cards from MongoDB"""
    try:
        cards = await cards_collection.find().to_list(1000)
        return {"cards": cards}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Convert uploaded image to base64 and return it"""
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Convert to base64
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        return {
            "filename": file.filename,
            "image_data": image_base64,
            "size": len(contents)
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)}) 