from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import base64
from PIL import Image
import io
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
<<<<<<< Updated upstream
from typing import Optional
=======
from typing import Optional, List
from datetime import datetime
from collections import Counter
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
=======
class DeckModel(BaseModel):
    name: str
    description: Optional[str] = None
    card_ids: List[str] = []  # List of card IDs in the deck
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

def validate_deck_rules(card_ids: List[str]) -> tuple[bool, str]:
    """Validate deck building rules:
    - Max 40 cards
    - Max 3 copies of same card
    - Max 1 champion card
    """
    if len(card_ids) > 40:
        return False, "Deck cannot exceed 40 cards"
    
    # Count card occurrences
    card_counts = Counter(card_ids)
    
    # Check for more than 3 copies of any card
    for card_id, count in card_counts.items():
        if count > 3:
            return False, f"Cannot have more than 3 copies of {card_id}"
    
    # Check for more than 1 champion card
    # add a 'is_champion' field to your cards or identify them by card_type
    # For now, assuming champion cards have 'champion' in their card_type
    champion_count = 0
    for card_id in card_ids:
        # 
        pass
    
    return True, "Deck is valid"

>>>>>>> Stashed changes
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
        
<<<<<<< Updated upstream
        return {
            "filename": file.filename,
            "image_data": image_base64,
            "size": len(contents)
        }
=======
        return {"message": f"Added {added_count} new cards to database"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# ===== DECK BUILDER ENDPOINTS =====

@app.post("/decks")
async def create_deck(deck: DeckModel):
    """Create a new deck"""
    try:
        # Validate deck rules
        is_valid, message = validate_deck_rules(deck.card_ids)
        if not is_valid:
            return JSONResponse(status_code=400, content={"error": message})
        
        # Set timestamps
        deck.created_at = datetime.now()
        deck.updated_at = datetime.now()
        
        result = await decks_collection.insert_one(deck.dict())
        return {"message": "Deck created successfully", "id": str(result.inserted_id)}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/decks")
async def get_decks():
    """Get all decks"""
    try:
        decks = await decks_collection.find().to_list(1000)
        return {"decks": decks}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/decks/{deck_id}")
async def get_deck(deck_id: str):
    """Get a specific deck with full card details"""
    try:
        from bson import ObjectId
        deck = await decks_collection.find_one({"_id": ObjectId(deck_id)})
        if not deck:
            return JSONResponse(status_code=404, content={"error": "Deck not found"})
        
        # Get full card details for each card in the deck
        deck_cards = []
        for card_id in deck["card_ids"]:
            card = await cards_collection.find_one({"card_id": card_id})
            if card:
                deck_cards.append(card)
        
        deck["cards"] = deck_cards
        return {"deck": deck}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.put("/decks/{deck_id}/add-card")
async def add_card_to_deck(deck_id: str, card_id: str):
    """Add a card to a deck"""
    try:
        from bson import ObjectId
        
        # Check if deck exists
        deck = await decks_collection.find_one({"_id": ObjectId(deck_id)})
        if not deck:
            return JSONResponse(status_code=404, content={"error": "Deck not found"})
        
        # Check if card exists
        card = await cards_collection.find_one({"card_id": card_id})
        if not card:
            return JSONResponse(status_code=404, content={"error": "Card not found"})
        
        # Create temporary deck with the new card to validate rules
        temp_card_ids = deck["card_ids"] + [card_id]
        is_valid, message = validate_deck_rules(temp_card_ids)
        if not is_valid:
            return JSONResponse(status_code=400, content={"error": message})
        
        # Add card to deck
        await decks_collection.update_one(
            {"_id": ObjectId(deck_id)},
            {
                "$push": {"card_ids": card_id},
                "$set": {"updated_at": datetime.now()}
            }
        )
        return {"message": "Card added to deck"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.put("/decks/{deck_id}/remove-card")
async def remove_card_from_deck(deck_id: str, card_id: str):
    """Remove a card from a deck"""
    try:
        from bson import ObjectId
        
        result = await decks_collection.update_one(
            {"_id": ObjectId(deck_id)},
            {
                "$pull": {"card_ids": card_id},
                "$set": {"updated_at": datetime.now()}
            }
        )
        
        if result.modified_count > 0:
            return {"message": "Card removed from deck"}
        else:
            return {"message": "Card not found in deck"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.delete("/decks/{deck_id}")
async def delete_deck(deck_id: str):
    """Delete a deck"""
    try:
        from bson import ObjectId
        
        result = await decks_collection.delete_one({"_id": ObjectId(deck_id)})
        if result.deleted_count > 0:
            return {"message": "Deck deleted successfully"}
        else:
            return JSONResponse(status_code=404, content={"error": "Deck not found"})
>>>>>>> Stashed changes
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/decks/{deck_id}/validation")
async def validate_deck(deck_id: str):
    """Get deck validation status and details"""
    try:
        from bson import ObjectId
        
        deck = await decks_collection.find_one({"_id": ObjectId(deck_id)})
        if not deck:
            return JSONResponse(status_code=404, content={"error": "Deck not found"})
        
        card_ids = deck["card_ids"]
        is_valid, message = validate_deck_rules(card_ids)
        
        # Get detailed validation info
        card_counts = Counter(card_ids)
        total_cards = len(card_ids)
        
        validation_info = {
            "is_valid": is_valid,
            "message": message,
            "total_cards": total_cards,
            "card_counts": dict(card_counts),
            "max_cards": 40,
            "max_copies": 3
        }
        
        return validation_info
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)}) 