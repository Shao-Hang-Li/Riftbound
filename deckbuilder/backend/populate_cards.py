#!/usr/bin/env python3
"""
Script to populate the MongoDB database with card data from the Riftbound_Cards directory.
This script creates card sets and populates the database with all card information.
"""

import asyncio
import os
import sys
import re
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Add the backend directory to the path so we can import from main.py
sys.path.append(os.path.dirname(__file__))

# Set information
SETS_INFO = {
    "Origins_MainSet": {
        "set_code": "OGN",
        "set_name": "Origins Main Set",
        "set_full_name": "Riftbound: Origins - Main Set",
        "release_date": "2024-01-01",
        "card_count": 353,
        "description": "The main set of Riftbound: Origins featuring 353 unique cards"
    },
    "Origins_ProvingGrounds": {
        "set_code": "OGS", 
        "set_name": "Origins Proving Grounds",
        "set_full_name": "Riftbound: Origins - Proving Grounds",
        "release_date": "2024-01-01",
        "card_count": 24,
        "description": "The Proving Grounds expansion featuring 24 additional cards"
    }
}

# Card type mappings
CARD_TYPE_MAPPING = {
    "Spell": "Spell",
    "Unit": "Unit", 
    "Champion Unit": "Champion Unit",
    "Signature Unit": "Signature Unit",
    "Signature Spell": "Signature Spell",
    "Legend": "Legend",
    "Battlefield": "Battlefield",
    "Gear": "Gear",
    "Rune": "Rune",
    "Token": "Token"
}

# Color mappings
COLOR_MAPPING = {
    "Fury": "Fury",
    "Body": "Body",
    "Mind": "Mind", 
    "Calm": "Calm",
    "Chaos": "Chaos",
    "Order": "Order",
    "Colorless": "Colorless"
}

# Rarity mappings
RARITY_MAPPING = {
    "Common": "Common",
    "Uncommon": "Uncommon",
    "Rare": "Rare",
    "Epic": "Epic",
    "Overnumbered": "Overnumbered"
}

async def create_sets():
    """Create card sets in the database"""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.deckbuilder
    sets_collection = db.sets
    
    print("Creating card sets...")
    
    for set_name, set_info in SETS_INFO.items():
        # Check if set already exists
        existing = await sets_collection.find_one({"set_code": set_info["set_code"]})
        if existing:
            print(f"⚠️  Set {set_info['set_code']} already exists")
            continue
            
        # Create the set
        set_doc = {
            "set_code": set_info["set_code"],
            "set_name": set_info["set_name"],
            "set_full_name": set_info["set_full_name"],
            "release_date": set_info["release_date"],
            "card_count": set_info["card_count"],
            "is_active": True,
            "description": set_info["description"],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        result = await sets_collection.insert_one(set_doc)
        print(f"✅ Created set {set_info['set_code']}: {set_info['set_name']}")
    
    client.close()

async def populate_cards():
    """Populate the database with card data from the Riftbound_Cards directory"""
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.deckbuilder
    cards_collection = db.cards
    
    # Get the cards directory path
    cards_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Riftbound_Cards"))
    
    print(f"Scanning cards directory: {cards_path}")
    
    if not os.path.exists(cards_path):
        print(f"❌ Cards directory not found: {cards_path}")
        return
    
    added_count = 0
    updated_count = 0
    errors = []
    
    for set_folder in os.listdir(cards_path):
        set_path = os.path.join(cards_path, set_folder)
        if os.path.isdir(set_path) and not set_folder.startswith('.'):
            print(f"\n📁 Processing set: {set_folder}")
            
            for filename in os.listdir(set_path):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    try:
                        # Extract card ID from filename (e.g., "OGN_001.png" -> "OGN_001")
                        card_id = os.path.splitext(filename)[0]
                        
                        # Extract set code from card ID
                        set_code_match = re.match(r'^([A-Z]{2,3})_(\d{3})([aS]?)$', card_id)
                        if not set_code_match:
                            print(f"⚠️  Skipping {filename} - doesn't match expected format")
                            continue
                            
                        set_code = set_code_match.group(1)
                        collector_number = set_code_match.group(2)
                        variant = set_code_match.group(3)  # 'a' for alt art, 'S' for signature, '' for regular
                        
                        # Determine variant type
                        if variant == 'a':
                            variant_type = "alt_art"
                        elif variant == 'S':
                            variant_type = "signature"
                        else:
                            variant_type = "regular"
                        
                        # Check if card already exists
                        existing = await cards_collection.find_one({"card_id": card_id})
                        if not existing:
                            # Create basic card entry
                            card_doc = {
                                "name": f"Card {card_id}",
                                "image_path": filename,
                                "card_id": card_id,
                                "set_name": set_folder,
                                "set_code": set_code,
                                "set_release_date": SETS_INFO.get(set_folder, {}).get("release_date", "2024-01-01"),
                                "card_type": "Spell",  # Default, should be updated manually
                                "subtype": [],
                                "color": ["Colorless"],  # Default, should be updated manually
                                "cost": 0,  # Default, should be updated manually
                                "rarity": "Common",  # Default, should be updated manually
                                "might": 0,
                                "description": "",
                                "flavor_text": "",
                                "artist": "",
                                "collector_number": collector_number,
                                "variant": variant_type,
                                "keywords": [],
                                "created_at": datetime.now(),
                                "updated_at": datetime.now()
                            }
                            
                            await cards_collection.insert_one(card_doc)
                            print(f"✅ Added {card_id}: {filename}")
                            added_count += 1
                        else:
                            # Update existing card with new image path if needed
                            if existing.get("image_path") != filename:
                                await cards_collection.update_one(
                                    {"_id": existing["_id"]},
                                    {"$set": {"image_path": filename, "updated_at": datetime.now()}}
                                )
                                print(f"🔄 Updated {card_id}: {filename}")
                                updated_count += 1
                            else:
                                print(f"⏭️  Skipped {card_id}: already exists")
                                
                    except Exception as e:
                        print(f"❌ Error processing {filename}: {str(e)}")
                        errors.append({"filename": filename, "error": str(e)})
    
    # Print summary
    print("\n" + "="*60)
    print("POPULATION SUMMARY")
    print("="*60)
    print(f"✅ Successfully added: {added_count} cards")
    print(f"🔄 Updated: {updated_count} cards")
    print(f"❌ Errors: {len(errors)} cards")
    
    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"  - {error['filename']}: {error['error']}")
    
    # Close connection
    client.close()
    print("\nDatabase connection closed.")

async def main():
    """Main function to run the population process"""
    print("🚀 Starting Riftbound Card Population Process")
    print("="*60)
    
    try:
        # Create sets first
        await create_sets()
        
        # Then populate cards
        await populate_cards()
        
        print("\n🎉 Population process completed successfully!")
        
    except Exception as e:
        print(f"\n💥 Population process failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
