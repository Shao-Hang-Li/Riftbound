#!/usr/bin/env python3
"""
Script to populate the Riftbound cards database with set information and card details.
This script helps you classify and store your cards in MongoDB.
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import json

# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.deckbuilder
cards_collection = db.cards
sets_collection = db.sets

# Set information for your Riftbound cards
SETS_DATA = [
    {
        "set_code": "OGN",
        "set_name": "Origins_MainSet",
        "set_full_name": "Riftbound Origins - Main Set",
        "release_date": "2024-01-01",  # Update with actual release date
        "card_count": 353,
        "is_active": True,
        "description": "The main set of Riftbound Origins, featuring the core mechanics and themes of the game."
    },
    {
        "set_code": "OGS",
        "set_name": "Origins_ProvingGrounds",
        "set_full_name": "Riftbound Origins - Proving Grounds",
        "release_date": "2024-01-01",  # Update with actual release date
        "card_count": 24,
        "is_active": True,
        "description": "A supplementary set featuring powerful cards and alternate art versions."
    }
]

# Card type and color enums to match the backend
class CardType:
    SPELL = "Spell"
    UNIT = "Unit"
    CHAMPION = "Champion"
    LEGEND = "Legend"
    BATTLEFIELD = "Battlefield"
    GEAR = "Gear"
    RUNE = "Rune"
    TOKEN = "Token"

class CardColor:
    FURY = "Fury"
    BODY = "Body"
    MIND = "Mind"
    CALM = "Calm"
    CHAOS = "Chaos"
    ORDER = "Order"
    COLORLESS = "Colorless"

class CardRarity:
    COMMON = "Common"
    UNCOMMON = "Uncommon"
    RARE = "Rare"
    EPIC = "Epic"
    OVERNUMBERED = "Overnumbered"

async def create_sets():
    """Create the card sets in the database"""
    print("Creating card sets...")
    
    for set_data in SETS_DATA:
        try:
            # Check if set already exists
            existing = await sets_collection.find_one({"set_code": set_data["set_code"]})
            if existing:
                print(f"Set {set_data['set_code']} already exists, skipping...")
                continue
            
            # Create the set
            result = await sets_collection.insert_one(set_data)
            print(f"Created set: {set_data['set_code']} - {set_data['set_full_name']}")
            
        except Exception as e:
            print(f"Error creating set {set_data['set_code']}: {e}")

async def update_card_classifications():
    """Update existing cards with proper classifications"""
    print("\nUpdating card classifications...")
    
    # Example card classifications - you'll need to customize these based on your actual cards
    card_updates = [
        # Example: Update a specific card with full details
        {
            "card_id": "OGN_001",
            "updates": {
                "name": "Example Unit Card",
                "card_type": CardType.UNIT,
                "card_subtype": "Human Warrior",
                "color": [CardColor.BODY],
                "cost": 2,
                "rarity": CardRarity.COMMON,
                "power": 2,
                "toughness": 2,
                "description": "A basic body unit card",
                "keywords": ["Vigilance"],
                "is_legendary": False,
                "is_mythic": False,
                "updated_at": datetime.now()
            }
        }
        # Add more card updates here as you classify your cards
    ]
    
    for update in card_updates:
        try:
            result = await cards_collection.update_one(
                {"card_id": update["card_id"]},
                {"$set": update["updates"]}
            )
            if result.modified_count > 0:
                print(f"Updated card: {update['card_id']}")
            else:
                print(f"Card not found: {update['card_id']}")
                
        except Exception as e:
            print(f"Error updating card {update['card_id']}: {e}")

async def scan_and_classify_cards():
    """Scan the cards directory and create basic entries for unclassified cards"""
    print("\nScanning cards directory...")
    
    # Use absolute path to Riftbound_Cards folder
    cards_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Riftbound_Cards"))
    added_count = 0
    updated_count = 0
    
    for set_folder in os.listdir(cards_dir):
        set_path = os.path.join(cards_dir, set_folder)
        if os.path.isdir(set_path) and not set_folder.startswith('.'):
            print(f"Processing set: {set_folder}")
            
            for filename in os.listdir(set_path):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    card_id = os.path.splitext(filename)[0]
                    
                    # Extract set code from card ID
                    import re
                    set_code_match = re.match(r'^([A-Z]{2,3})_(\d{3})$', card_id)
                    if not set_code_match:
                        print(f"Skipping invalid card ID format: {card_id}")
                        continue
                        
                    set_code = set_code_match.group(1)
                    collector_number = set_code_match.group(2)
                    
                    # Check if card already exists
                    existing = await cards_collection.find_one({"card_id": card_id})
                    if not existing:
                        # Create basic card entry
                        card_data = {
                            "name": f"Card {card_id}",
                            "image_path": filename,
                            "card_id": card_id,
                            "set_name": set_folder,
                            "set_code": set_code,
                            "card_type": CardType.SPELL,  # Default, update as needed
                            "color": [CardColor.COLORLESS],  # Default, update as needed
                            "cost": 0,  # Default, update as needed
                            "rarity": CardRarity.COMMON,  # Default, update as needed
                            "collector_number": collector_number,
                            "keywords": [],
                            "created_at": datetime.now(),
                            "updated_at": datetime.now()
                        }
                        
                        await cards_collection.insert_one(card_data)
                        added_count += 1
                        print(f"Added card: {card_id}")
                    else:
                        # Update existing card if needed
                        if existing.get("image_path") != filename:
                            await cards_collection.update_one(
                                {"_id": existing["_id"]},
                                {"$set": {"image_path": filename, "updated_at": datetime.now()}}
                            )
                            updated_count += 1
                            print(f"Updated card: {card_id}")
    
    print(f"\nScan completed: Added {added_count} new cards, updated {updated_count} existing cards")

async def export_card_template():
    """Export a template for manual card classification"""
    print("\nExporting card classification template...")
    
    # Get all unclassified cards (cards with default names)
    unclassified_cards = await cards_collection.find({
        "name": {"$regex": "^Card "}
    }).to_list(1000)
    
    template_data = []
    for card in unclassified_cards:
        template_data.append({
            "card_id": card["card_id"],
            "set_code": card["set_code"],
            "current_name": card["name"],
            "suggested_name": "",
            "card_type": "",
            "card_subtype": "",
            "color": [],
            "cost": 0,
            "rarity": "",
            "power": None,
            "toughness": None,
            "description": "",
            "keywords": [],
            "is_legendary": False,
            "is_mythic": False
        })
    
    # Save template to file
    with open("card_classification_template.json", "w") as f:
        json.dump(template_data, f, indent=2)
    
    print(f"Exported template for {len(template_data)} cards to 'card_classification_template.json'")
    print("Fill in the template and use it to update your cards!")

async def import_card_classifications(template_file):
    """Import card classifications from a filled template"""
    print(f"\nImporting card classifications from {template_file}...")
    
    try:
        with open(template_file, "r") as f:
            classifications = json.load(f)
        
        updated_count = 0
        for card_data in classifications:
            try:
                # Update the card with new classification
                result = await cards_collection.update_one(
                    {"card_id": card_data["card_id"]},
                    {
                        "$set": {
                            "name": card_data["suggested_name"],
                            "card_type": card_data["card_type"],
                            "card_subtype": card_data["card_subtype"],
                            "color": card_data["color"],
                            "cost": card_data["cost"],
                            "rarity": card_data["rarity"],
                            "power": card_data["power"],
                            "toughness": card_data["toughness"],
                            "description": card_data["description"],
                            "keywords": card_data["keywords"],
                            "is_legendary": card_data["is_legendary"],
                            "is_mythic": card_data["is_mythic"],
                            "updated_at": datetime.now()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    updated_count += 1
                    print(f"Updated card: {card_data['card_id']} - {card_data['suggested_name']}")
                
            except Exception as e:
                print(f"Error updating card {card_data['card_id']}: {e}")
        
        print(f"\nImport completed: Updated {updated_count} cards")
        
    except FileNotFoundError:
        print(f"Template file {template_file} not found!")
    except Exception as e:
        print(f"Error importing classifications: {e}")

async def main():
    """Main function to run the card population process"""
    print("Riftbound Card Database Population Tool")
    print("=" * 50)
    
    try:
        # Create sets
        await create_sets()
        
        # Scan and create basic card entries
        await scan_and_classify_cards()
        
        # Export template for manual classification
        await export_card_template()
        
        # Example: Update some specific cards (customize as needed)
        await update_card_classifications()
        
        print("\n" + "=" * 50)
        print("Setup completed!")
        print("\nNext steps:")
        print("1. Fill out the 'card_classification_template.json' file with your card details")
        print("2. Run: python populate_cards.py --import card_classification_template.json")
        print("3. Or manually update cards using the API endpoints")
        
    except Exception as e:
        print(f"Error in main process: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--import":
        if len(sys.argv) > 2:
            template_file = sys.argv[2]
            asyncio.run(import_card_classifications(template_file))
        else:
            print("Usage: python populate_cards.py --import <template_file>")
    else:
        asyncio.run(main())
