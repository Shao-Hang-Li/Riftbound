from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re

app = FastAPI(title="Riftbound Deck Builder", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.deckbuilder
cards_collection = db.cards
decks_collection = db.decks
sets_collection = db.sets

# Create indexes for better performance
async def create_indexes():
    await cards_collection.create_index("card_id", unique=True)
    await cards_collection.create_index("set_code")
    await cards_collection.create_index("card_type")
    await cards_collection.create_index("color")
    await cards_collection.create_index("cost")
    await cards_collection.create_index("rarity")
    await sets_collection.create_index("set_code", unique=True)

# Mount the cards directory to serve images
# Use absolute path to Riftbound_Cards folder
cards_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Riftbound_Cards"))

# Debug: Print the calculated path
print(f"Cards directory path: {cards_path}")
print(f"Directory exists: {os.path.exists(cards_path)}")

# Only mount if directory exists
if os.path.exists(cards_path):
    app.mount("/cards", StaticFiles(directory=cards_path), name="cards")
    print("Successfully mounted cards directory")
else:
    print(f"WARNING: Cards directory not found at {cards_path}")
    print("Card images will not be served until the directory is created")

# Enums for card classification
class CardType(str, Enum):
    SPELL = "Spell"
    UNIT = "Unit"
    CHAMPION = "Champion"
    LEGEND = "Legend"
    BATTLEFIELD = "Battlefield"
    GEAR = "Gear"
    RUNE = "Rune"
    TOKEN = "Token"

class CardColor(str, Enum):
    FURY = "Fury"
    BODY = "Body"
    MIND = "Mind"
    CALM = "Calm"
    CHAOS = "Chaos"
    ORDER = "Order"
    COLORLESS = "Colorless"

class CardRarity(str, Enum):
    COMMON = "Common"
    UNCOMMON = "Uncommon"
    RARE = "Rare"
    EPIC = "Epic"
    OVERNUMBERED = "Overnumbered"

# Pydantic models
class CardModel(BaseModel):
    name: str = Field(..., min_length=1)
    image_path: str
    card_id: str = Field(..., pattern=r'^[A-Z]{2,3}_\d{3}$')  # e.g., "OGN_001"
    set_name: str
    set_code: str = Field(..., pattern=r'^[A-Z]{2,3}$')  # e.g., "OGN"
    set_release_date: Optional[str] = None
    card_type: CardType
    card_subtype: Optional[str] = None
    color: List[CardColor]
    cost: int = Field(..., ge=0, le=7)  # 0 to 7+
    rarity: CardRarity
    power: Optional[int] = Field(None, ge=0)
    toughness: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    flavor_text: Optional[str] = None
    artist: Optional[str] = None
    collector_number: str
    is_legendary: bool = False
    is_mythic: bool = False
    keywords: Optional[List[str]] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SetInfoModel(BaseModel):
    set_code: str = Field(..., pattern=r'^[A-Z]{2,3}$')
    set_name: str
    set_full_name: str
    release_date: str
    card_count: int = Field(..., ge=0)
    is_active: bool = True
    description: Optional[str] = None

class DeckModel(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    card_ids: List[str] = Field(default_factory=list)
    deck_colors: List[CardColor] = Field(default_factory=list)
    total_cost: int = Field(default=0, ge=0)
    average_cost: float = Field(default=0.0, ge=0.0)
    card_type_distribution: dict = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Initialize indexes on startup
@app.on_event("startup")
async def startup_event():
    await create_indexes()

@app.get("/")
def read_root():
    return {
        "message": "Riftbound Deck Builder Backend",
        "cards_path": cards_path,
        "cards_directory_exists": os.path.exists(cards_path)
    }

# ===== SET MANAGEMENT ENDPOINTS =====

@app.post("/sets")
async def create_set(set_info: SetInfoModel):
    """Create a new card set"""
    try:
        # Check if set already exists
        existing = await sets_collection.find_one({"set_code": set_info.set_code})
        if existing:
            raise HTTPException(status_code=400, detail=f"Set with code {set_info.set_code} already exists")
        
        result = await sets_collection.insert_one(set_info.dict())
        return {"message": "Set created successfully", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sets")
async def get_sets():
    """Get all card sets"""
    try:
        sets = await sets_collection.find().to_list(1000)
        return {"sets": sets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== CARD MANAGEMENT ENDPOINTS =====

@app.post("/add-card")
async def add_card(card: CardModel):
    """Add a card reference to MongoDB"""
    try:
        # Check if image file exists
        full_path = os.path.join(cards_path, card.set_name, card.image_path)
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="Image file not found")
        
        # Check if card already exists
        existing = await cards_collection.find_one({"card_id": card.card_id})
        if existing:
            raise HTTPException(status_code=400, detail=f"Card with ID {card.card_id} already exists")
        
        # Set timestamps
        card.created_at = datetime.now()
        card.updated_at = datetime.now()
        
        # Store card info in MongoDB
        result = await cards_collection.insert_one(card.dict())
        return {"message": "Card added successfully", "id": str(result.inserted_id)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cards")
async def get_cards(
    set_code: Optional[str] = None,
    card_type: Optional[CardType] = None,
    color: Optional[CardColor] = None,
    rarity: Optional[CardRarity] = None,
    min_cost: Optional[int] = None,
    max_cost: Optional[int] = None,
    limit: int = 100
):
    """Get cards with optional filters"""
    try:
        # Build filter query
        filter_query = {}
        if set_code:
            filter_query["set_code"] = set_code
        if card_type:
            filter_query["card_type"] = card_type
        if color:
            filter_query["color"] = color
        if rarity:
            filter_query["rarity"] = rarity
        if min_cost is not None or max_cost is not None:
            cost_filter = {}
            if min_cost is not None:
                cost_filter["$gte"] = min_cost
            if max_cost is not None:
                cost_filter["$lte"] = max_cost
            filter_query["cost"] = cost_filter
        
        cards = await cards_collection.find(filter_query).limit(limit).to_list(limit)
        return {"cards": cards, "count": len(cards)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cards/{set_name}")
async def get_cards_by_set(set_name: str):
    """Get all cards from a specific set"""
    try:
        cards = await cards_collection.find({"set_name": set_name}).to_list(1000)
        return {"cards": cards, "count": len(cards)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cards/stats/summary")
async def get_cards_summary():
    """Get summary statistics for all cards"""
    try:
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_cards": {"$sum": 1},
                    "total_sets": {"$addToSet": "$set_code"},
                    "avg_cost": {"$avg": "$cost"},
                    "card_types": {"$addToSet": "$card_type"},
                    "colors": {"$addToSet": "$color"},
                    "rarities": {"$addToSet": "$rarity"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "total_cards": 1,
                    "total_sets": {"$size": "$total_sets"},
                    "avg_cost": {"$round": ["$avg_cost", 2]},
                    "card_types": 1,
                    "colors": 1,
                    "rarities": 1
                }
            }
        ]
        
        result = await cards_collection.aggregate(pipeline).to_list(1)
        if result:
            return result[0]
        return {"total_cards": 0, "total_sets": 0, "avg_cost": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cards/stats/by-set")
async def get_cards_stats_by_set():
    """Get card statistics grouped by set"""
    try:
        pipeline = [
            {
                "$group": {
                    "_id": "$set_code",
                    "set_name": {"$first": "$set_name"},
                    "card_count": {"$sum": 1},
                    "avg_cost": {"$avg": "$cost"},
                    "card_types": {"$addToSet": "$card_type"},
                    "colors": {"$addToSet": "$color"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "set_code": "$_id",
                    "set_name": 1,
                    "card_count": 1,
                    "avg_cost": {"$round": ["$avg_cost", 2]},
                    "card_types": 1,
                    "colors": 1
                }
            },
            {"$sort": {"set_code": 1}}
        ]
        
        result = await cards_collection.aggregate(pipeline).to_list(1000)
        return {"set_stats": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/image/{set_name}/{filename}")
async def get_card_image(set_name: str, filename: str):
    """Serve a card image file"""
    image_path = os.path.join(cards_path, set_name, filename)
    if os.path.exists(image_path):
        return FileResponse(image_path)
    else:
        raise HTTPException(status_code=404, detail="Image not found")

@app.post("/scan-cards")
async def scan_cards_directory():
    """Automatically scan the Riftbound_Cards directory and add all cards to MongoDB"""
    try:
        cards_dir = cards_path
        added_count = 0
        updated_count = 0
        
        for set_folder in os.listdir(cards_dir):
            set_path = os.path.join(cards_dir, set_folder)
            if os.path.isdir(set_path) and not set_folder.startswith('.'):
                for filename in os.listdir(set_path):
                    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                        # Extract card ID from filename (e.g., "OGN_001.png" -> "OGN_001")
                        card_id = os.path.splitext(filename)[0]
                        
                        # Extract set code from card ID
                        set_code_match = re.match(r'^([A-Z]{2,3})_(\d{3})$', card_id)
                        if not set_code_match:
                            continue
                            
                        set_code = set_code_match.group(1)
                        collector_number = set_code_match.group(2)
                        
                        # Check if card already exists
                        existing = await cards_collection.find_one({"card_id": card_id})
                        if not existing:
                            # Create basic card entry (user will need to fill in details)
                            card = CardModel(
                                name=f"Card {card_id}",
                                image_path=filename,
                                card_id=card_id,
                                set_name=set_folder,
                                set_code=set_code,
                                card_type=CardType.SPELL,  # Default, user should update
                                color=[CardColor.COLORLESS],  # Default, user should update
                                cost=0,  # Default, user should update
                                rarity=CardRarity.COMMON,  # Default, user should update
                                collector_number=collector_number,
                                keywords=[]
                            )
                            await cards_collection.insert_one(card.dict())
                            added_count += 1
                        else:
                            # Update existing card with new image path if needed
                            if existing.get("image_path") != filename:
                                await cards_collection.update_one(
                                    {"_id": existing["_id"]},
                                    {"$set": {"image_path": filename, "updated_at": datetime.now()}}
                                )
                                updated_count += 1
        
        return {
            "message": f"Scan completed. Added {added_count} new cards, updated {updated_count} existing cards"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/cards/{card_id}")
async def update_card(card_id: str, card_updates: dict):
    """Update a specific card with new information"""
    try:
        # Remove fields that shouldn't be updated
        updates = {k: v for k, v in card_updates.items() 
                  if k not in ['_id', 'card_id', 'created_at']}
        updates['updated_at'] = datetime.now()
        
        result = await cards_collection.update_one(
            {"card_id": card_id},
            {"$set": updates}
        )
        
        if result.modified_count > 0:
            return {"message": f"Card {card_id} updated successfully"}
        else:
            raise HTTPException(status_code=404, detail=f"Card {card_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cards/bulk-update")
async def bulk_update_cards(card_updates: List[dict]):
    """Bulk update multiple cards at once"""
    try:
        updated_count = 0
        errors = []
        
        for update in card_updates:
            try:
                card_id = update.get('card_id')
                if not card_id:
                    errors.append({"card_id": "missing", "error": "Missing card_id"})
                    continue
                
                # Remove card_id from updates
                updates = {k: v for k, v in update.items() if k != 'card_id'}
                updates['updated_at'] = datetime.now()
                
                result = await cards_collection.update_one(
                    {"card_id": card_id},
                    {"$set": updates}
                )
                
                if result.modified_count > 0:
                    updated_count += 1
                else:
                    errors.append({"card_id": card_id, "error": "Card not found"})
                    
            except Exception as e:
                errors.append({"card_id": update.get('card_id', 'unknown'), "error": str(e)})
        
        return {
            "message": f"Bulk update completed. Updated {updated_count} cards.",
            "updated_count": updated_count,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== DECK BUILDER ENDPOINTS =====

@app.post("/decks")
async def create_deck(deck: DeckModel):
    """Create a new deck"""
    try:
        # Validate deck size (max 40 cards)
        if len(deck.card_ids) > 40:
            raise HTTPException(status_code=400, detail="Deck cannot exceed 40 cards")
        
        # Check for more than 3 copies of any card
        card_counts = {}
        for card_id in deck.card_ids:
            card_counts[card_id] = card_counts.get(card_id, 0) + 1
            if card_counts[card_id] > 3:
                raise HTTPException(status_code=400, detail=f"Cannot have more than 3 copies of {card_id}")
        
        # Set timestamps
        deck.created_at = datetime.now()
        deck.updated_at = datetime.now()
        
        result = await decks_collection.insert_one(deck.dict())
        return {"message": "Deck created successfully", "id": str(result.inserted_id)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/decks")
async def get_decks():
    """Get all decks"""
    try:
        decks = await decks_collection.find().to_list(1000)
        return {"decks": decks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/decks/{deck_id}")
async def get_deck(deck_id: str):
    """Get a specific deck with full card details"""
    try:
        from bson import ObjectId
        deck = await decks_collection.find_one({"_id": ObjectId(deck_id)})
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found")
        
        # Get full card details for each card in the deck
        deck_cards = []
        for card_id in deck["card_ids"]:
            card = await cards_collection.find_one({"card_id": card_id})
            if card:
                deck_cards.append(card)
        
        deck["cards"] = deck_cards
        return {"deck": deck}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/decks/{deck_id}/add-card")
async def add_card_to_deck(deck_id: str, card_id: str):
    """Add a card to a deck"""
    try:
        from bson import ObjectId
        
        # Check if deck exists
        deck = await decks_collection.find_one({"_id": ObjectId(deck_id)})
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found")
        
        # Check if card exists
        card = await cards_collection.find_one({"card_id": card_id})
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        # Check deck size limit
        if len(deck["card_ids"]) >= 40:
            raise HTTPException(status_code=400, detail="Deck is full (40 cards)")
        
        # Check if adding this card would exceed 3 copies
        current_count = deck["card_ids"].count(card_id)
        if current_count >= 3:
            raise HTTPException(status_code=400, detail=f"Cannot have more than 3 copies of {card_id}")
        
        # Add card to deck
        await decks_collection.update_one(
            {"_id": ObjectId(deck_id)},
            {
                "$push": {"card_ids": card_id},
                "$set": {"updated_at": datetime.now()}
            }
        )
        return {"message": "Card added to deck"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/decks/{deck_id}")
async def delete_deck(deck_id: str):
    """Delete a deck"""
    try:
        from bson import ObjectId
        
        result = await decks_collection.delete_one({"_id": ObjectId(deck_id)})
        if result.deleted_count > 0:
            return {"message": "Deck deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Deck not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 