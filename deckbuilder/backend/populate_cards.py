#!/usr/bin/env python3
"""
Script to populate MongoDB with Riftbound cards from the Riftbound_Cards directory.
This script will scan the directory structure and create card entries for all PNG files.
"""

import asyncio
import os
import re
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from typing import Dict, List, Optional

# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.deckbuilder
cards_collection = db.cards
sets_collection = db.sets

# Card type mapping based on filename patterns
CARD_TYPE_MAPPING = {
    "SPELL": "Spell",
    "UNIT": "Unit", 
    "CHAMPION": "Champion",
    "LEGEND": "Legend",
    "BATTLEFIELD": "Battlefield",
    "GEAR": "Gear",
    "RUNE": "Rune",
    "TOKEN": "Token"
}

# Set information
SETS_INFO = {
    "Origins_MainSet": {
        "set_code": "OGN",
        "set_name": "Origins Main Set",
        "set_full_name": "Riftbound: Origins Main Set",
        "release_date": "2024-01-01",
        "description": "The core set of Riftbound: Origins featuring the main gameplay mechanics and card pool."
    },
    "Origins_ProvingGrounds": {
        "set_code": "OGS", 
        "set_name": "Origins Proving Grounds",
        "set_full_name": "Riftbound: Origins Proving Grounds",
        "release_date": "2024-01-01",
        "description": "The Proving Grounds expansion set featuring advanced strategies and powerful cards."
    }
}

async def create_sets():
    """Create the set entries in MongoDB"""
    print("Creating set entries...")
    
    for set_folder, set_info in SETS_INFO.items():
        # Check if set already exists
        existing = await sets_collection.find_one({"set_code": set_info["set_code"]})
        if not existing:
            set_doc = {
                **set_info,
                "card_count": 0,
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            await sets_collection.insert_one(set_doc)
            print(f"Created set: {set_info['set_name']} ({set_info['set_code']})")
        else:
            print(f"Set already exists: {set_info['set_name']} ({set_info['set_code']})")

async def extract_card_metadata(filename: str, set_folder: str) -> Optional[Dict]:
    """
    Extract card metadata from filename.
    Expected formats: 
    - OGN_001.png (regular card)
    - OGN_001a.png (alt art version)
    - OGN_299S.png (signature version)
    """
    # Remove extension
    card_id = os.path.splitext(filename)[0]
    
    # Match patterns:
    # SET_XXX (e.g., OGN_001) - regular card
    # SET_XXXa (e.g., OGN_007a) - alt art version
    # SET_XXXS (e.g., OGN_299S) - signature version
    match = re.match(r'^([A-Z]{2,3})_(\d{3})([aS]?)$', card_id)
    if not match:
        print(f"Skipping {filename}: Invalid filename format")
        return None
    
    set_code = match.group(1)
    collector_number = match.group(2)
    variant = match.group(3)  # 'a' for alt art, 'S' for signature, '' for regular
    
    # Get set info
    set_info = None
    for folder, info in SETS_INFO.items():
        if info["set_code"] == set_code:
            set_info = info
            break
    
    if not set_info:
        print(f"Skipping {filename}: Unknown set code {set_code}")
        return None
    
    # Determine card name based on variant
    if variant == 'a':
        card_name = f"Card {set_code}_{collector_number} (Alt Art)"
        variant_type = "alt_art"
    elif variant == 'S':
        card_name = f"Card {set_code}_{collector_number} (Signature)"
        variant_type = "signature"
    else:
        card_name = f"Card {set_code}_{collector_number}"
        variant_type = "regular"
    
    # Create basic card data
    card_data = {
        "name": card_name,  # Placeholder name with variant info
        "image_path": filename,
        "card_id": card_id,
        "set_name": set_folder,
        "set_code": set_code,
        "set_release_date": set_info["release_date"],
        "card_type": "Spell",  # Default, will need manual update
        "card_subtype": None,
        "color": ["Colorless"],  # Default, will need manual update
        "cost": 0,  # Default, will need manual update
        "rarity": "Common",  # Default, will need manual update
        "power": None,
        "toughness": None,
        "description": None,
        "flavor_text": None,
        "artist": None,
        "collector_number": collector_number,
        "variant": variant_type,  # Use the proper variant type
        "is_legendary": False,
        "is_mythic": False,
        "keywords": [],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    return card_data

async def populate_cards():
    """Scan the Riftbound_Cards directory and populate the database"""
    print("Starting card population...")
    
    # Get the path to Riftbound_Cards directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    cards_path = os.path.join(current_dir, "..", "..", "Riftbound_Cards")
    
    if not os.path.exists(cards_path):
        print(f"Error: Cards directory not found at {cards_path}")
        return
    
    print(f"Scanning cards directory: {cards_path}")
    
    added_count = 0
    updated_count = 0
    skipped_count = 0
    
    # Process each set folder
    for set_folder in os.listdir(cards_path):
        set_path = os.path.join(cards_path, set_folder)
        
        if not os.path.isdir(set_path) or set_folder.startswith('.'):
            continue
            
        if set_folder not in SETS_INFO:
            print(f"Skipping unknown set folder: {set_folder}")
            continue
            
        print(f"\nProcessing set: {set_folder}")
        
        # Process each PNG file in the set folder
        for filename in os.listdir(set_path):
            if not filename.lower().endswith('.png'):
                continue
                
            # Extract metadata from filename
            card_data = await extract_card_metadata(filename, set_folder)
            if not card_data:
                skipped_count += 1
                continue
            
            # Check if card already exists
            existing = await cards_collection.find_one({"card_id": card_data["card_id"]})
            
            if not existing:
                # Insert new card
                await cards_collection.insert_one(card_data)
                added_count += 1
                variant_info = f" ({card_data['variant']})" if card_data['variant'] != 'regular' else ""
                print(f"  Added: {card_data['card_id']}{variant_info}")
            else:
                # Update existing card if image path changed
                if existing.get("image_path") != card_data["image_path"]:
                    await cards_collection.update_one(
                        {"_id": existing["_id"]},
                        {"$set": {
                            "image_path": card_data["image_path"],
                            "variant": card_data["variant"],
                            "updated_at": datetime.now()
                        }}
                    )
                    updated_count += 1
                    variant_info = f" ({card_data['variant']})" if card_data['variant'] != 'regular' else ""
                    print(f"  Updated: {card_data['card_id']}{variant_info}")
                else:
                    variant_info = f" ({existing.get('variant', 'regular')})" if existing.get('variant') != 'regular' else ""
                    print(f"  Exists: {card_data['card_id']}{variant_info}")
    
    # Update set card counts
    for set_folder, set_info in SETS_INFO.items():
        count = await cards_collection.count_documents({"set_name": set_folder})
        await sets_collection.update_one(
            {"set_code": set_info["set_code"]},
            {"$set": {
                "card_count": count,
                "updated_at": datetime.now()
            }}
        )
    
    print(f"\nPopulation complete!")
    print(f"Added: {added_count} cards")
    print(f"Updated: {updated_count} cards") 
    print(f"Skipped: {skipped_count} cards")
    
    # Print summary
    total_cards = await cards_collection.count_documents({})
    print(f"Total cards in database: {total_cards}")
    
    # Count variants by type
    alt_art_count = await cards_collection.count_documents({"variant": "alt_art"})
    signature_count = await cards_collection.count_documents({"variant": "signature"})
    regular_count = await cards_collection.count_documents({"variant": "regular"})
    
    print(f"Regular cards: {regular_count}")
    print(f"Alt art variants: {alt_art_count}")
    print(f"Signature variants: {signature_count}")
    
    for set_folder, set_info in SETS_INFO.items():
        count = await cards_collection.count_documents({"set_name": set_folder})
        print(f"{set_info['set_name']}: {count} cards")

async def main():
    """Main function to run the population script"""
    try:
        print("Riftbound Card Population Script")
        print("=" * 40)
        
        # Create sets first
        await create_sets()
        print()
        
        # Populate cards
        await populate_cards()
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Close MongoDB connection
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
