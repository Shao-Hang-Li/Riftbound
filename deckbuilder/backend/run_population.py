#!/usr/bin/env python3
"""
Script to run the card population process.
This is a simple wrapper around populate_cards.py for easy execution.
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(__file__))

from populate_cards import main

if __name__ == "__main__":
    print("🎯 Running Riftbound Card Population")
    print("This will populate the database with all cards from the Riftbound_Cards directory.")
    print("Make sure MongoDB is running on localhost:27017")
    print()
    
    # Run the population process
    asyncio.run(main())
