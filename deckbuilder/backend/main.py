from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

app = FastAPI(title="Riftbound Deck Builder", version="1.0.0")

# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.deckbuilder
cards_collection = db.cards
decks_collection = db.decks

# Mount the cards directory to serve images
app.mount("/cards", StaticFiles(directory="../Riftbound_Cards"), name="cards")

class CardModel(BaseModel):
    name: str
    image_path: str  # Path to the image file
    card_id: str     # e.g., "OGN_001"
    set_name: str    # e.g., "Origins_MainSet"
    card_type: str
    description: Optional[str] = None

class DeckModel(BaseModel):
    name: str
    description: Optional[str] = None
    card_ids: List[str] = []  # List of card IDs in the deck
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@app.get("/")
def read_root():
    return {"message": "Riftbound Deck Builder Backend"}

# ===== CARD GALLERY ENDPOINTS =====

@app.post("/add-card")
async def add_card(card: CardModel):
    """Add a card reference to MongoDB"""
    try:
        # Check if image file exists
        full_path = f"../Riftbound_Cards/{card.set_name}/{card.image_path}"
        if not os.path.exists(full_path):
            return JSONResponse(status_code=404, content={"error": "Image file not found"})
        
        # Store card info in MongoDB
        result = await cards_collection.insert_one(card.dict())
        return {"message": "Card added successfully", "id": str(result.inserted_id)}
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

@app.get("/cards/{set_name}")
async def get_cards_by_set(set_name: str):
    """Get all cards from a specific set"""
    try:
        cards = await cards_collection.find({"set_name": set_name}).to_list(1000)
        return {"cards": cards}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/image/{set_name}/{filename}")
async def get_card_image(set_name: str, filename: str):
    """Serve a card image file"""
    image_path = f"../Riftbound_Cards/{set_name}/{filename}"
    if os.path.exists(image_path):
        return FileResponse(image_path)
    else:
        return JSONResponse(status_code=404, content={"error": "Image not found"})

@app.post("/scan-cards")
async def scan_cards_directory():
    """Automatically scan the Riftbound_Cards directory and add all cards to MongoDB"""
    try:
        cards_dir = "../Riftbound_Cards"
        added_count = 0
        
        for set_folder in os.listdir(cards_dir):
            set_path = os.path.join(cards_dir, set_folder)
            if os.path.isdir(set_path) and not set_folder.startswith('.'):
                for filename in os.listdir(set_path):
                    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                        # Extract card ID from filename (e.g., "OGN_001.png" -> "OGN_001")
                        card_id = os.path.splitext(filename)[0]
                        
                        # Check if card already exists
                        existing = await cards_collection.find_one({"card_id": card_id})
                        if not existing:
                            card = CardModel(
                                name=f"Card {card_id}",
                                image_path=filename,
                                card_id=card_id,
                                set_name=set_folder,
                                card_type="Unknown",
                                description=None
                            )
                            await cards_collection.insert_one(card.dict())
                            added_count += 1
        
        return {"message": f"Added {added_count} new cards to database"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# ===== DECK BUILDER ENDPOINTS =====

@app.post("/decks")
async def create_deck(deck: DeckModel):
    """Create a new deck"""
    try:
        # Validate deck size (max 40 cards)
        if len(deck.card_ids) > 40:
            return JSONResponse(status_code=400, content={"error": "Deck cannot exceed 40 cards"})
        
        # Check for more than 3 copies of any card
        card_counts = {}
        for card_id in deck.card_ids:
            card_counts[card_id] = card_counts.get(card_id, 0) + 1
            if card_counts[card_id] > 3:
                return JSONResponse(status_code=400, content={"error": f"Cannot have more than 3 copies of {card_id}"})
        
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
        
        # Check deck size limit
        if len(deck["card_ids"]) >= 40:
            return JSONResponse(status_code=400, content={"error": "Deck is full (40 cards)"})
        
        # Check if adding this card would exceed 3 copies
        current_count = deck["card_ids"].count(card_id)
        if current_count >= 3:
            return JSONResponse(status_code=400, content={"error": f"Cannot have more than 3 copies of {card_id}"})
        
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
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)}) 