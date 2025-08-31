#!/usr/bin/env python3
"""
Simple runner script to populate the MongoDB database with Riftbound cards.
Run this after starting your MongoDB server and FastAPI backend.
"""

import asyncio
import sys
import os

# Add the current directory to Python path so we can import populate_cards
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from populate_cards import main

if __name__ == "__main__":
    print("Starting Riftbound card population...")
    print("Make sure MongoDB is running and accessible at localhost:27017")
    print()
    
    try:
        asyncio.run(main())
        print("\n✅ Population completed successfully!")
        print("\nNext steps:")
        print("1. Start your FastAPI backend: uvicorn main:app --reload")
        print("2. Use the API endpoints to view and update your cards")
        print("3. Update card details using PUT /cards/{card_id} or POST /cards/bulk-update")
        
    except Exception as e:
        print(f"\n❌ Error during population: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure MongoDB is running")
        print("2. Check that the Riftbound_Cards directory exists")
        print("3. Verify your MongoDB connection string")
        sys.exit(1)
