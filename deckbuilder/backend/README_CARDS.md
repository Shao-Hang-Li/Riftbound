# Riftbound Card Storage System

This system allows you to store all your Riftbound cards in MongoDB with automatic image serving and metadata management.

## How It Works

### 1. **Image Storage**
- **Images are NOT stored in MongoDB** - they remain as PNG files in your `Riftbound_Cards` directory
- MongoDB only stores the **image path** and **metadata** (name, cost, type, etc.)
- Images are served directly from the filesystem via FastAPI's static file serving

### 2. **Card Sets**
Your cards are organized into two sets:
- **Origins_MainSet** (OGN) - 353 cards
- **Origins_ProvingGrounds** (OGS) - 24 cards

### 3. **Card Metadata Structure**
Each card stores:
- Basic info: name, card_id, set_code, collector_number
- Game mechanics: cost, power, toughness, color, type
- Classification: rarity, keywords, subtypes
- References: image_path, artist, description
- Timestamps: created_at, updated_at

## Setup Instructions

### 1. **Start MongoDB**
Make sure MongoDB is running on localhost:27017

### 2. **Populate the Database**
```bash
cd backend
python run_population.py
```

This will:
- Create the two card sets in MongoDB
- Scan your `Riftbound_Cards` directory
- Create card entries for ALL PNG files (including variants)
- Extract metadata from filenames (e.g., "OGN_001.png" → card_id: "OGN_001")
- Handle alt art versions (ending with 'a') and signature versions (ending with 'S')

### 3. **Start the Backend**
```bash
uvicorn main:app --reload
```

## API Endpoints

### **Card Management**
- `GET /cards` - List all cards with filters (including variant filtering)
- `GET /cards/{set_name}` - Get cards from a specific set
- `POST /add-card` - Add a new card to the database
- `PUT /cards/{card_id}` - Update a specific card
- `POST /cards/bulk-update` - Update multiple cards at once
- `POST /cards/update-from-data` - Update cards from structured data format
- `POST /scan-cards` - Scan directory and add all cards

### **Set Management**
- `GET /sets` - List all card sets
- `POST /sets` - Create a new set

### **Deck Management**
- `POST /decks` - Create a new deck
- `GET /decks` - Get all decks
- `GET /decks/{deck_id}` - Get a specific deck
- `PUT /decks/{deck_id}/add-card` - Add a card to a deck
- `PUT /decks/{deck_id}/remove-card` - Remove a card from a deck
- `DELETE /decks/{deck_id}` - Delete a deck

### **Image Serving**
- `GET /cards/{set_name}/{filename}` - Serve card images
- Images are also available at `/cards/{set_name}/{filename}` via static file serving

## Updating Card Details

### **Individual Card Update**
```bash
curl -X PUT "http://localhost:8000/cards/OGN_001" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fireball",
    "card_type": "Spell",
    "color": ["Fury"],
    "cost": 2,
    "rarity": "Common",
    "description": "Deal 3 damage to target creature or player"
  }'
```

### **Bulk Update**
```bash
curl -X POST "http://localhost:8000/cards/bulk-update" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "card_id": "OGN_001",
      "name": "Fireball",
      "card_type": "Spell",
      "color": ["Fury"],
      "cost": 2
    },
    {
      "card_id": "OGN_002", 
      "name": "Warrior",
      "card_type": "Unit",
      "color": ["Body"],
      "cost": 1,
      "power": 2,
      "toughness": 2
    }
  ]'
```

## Card Classification Guide

### **Card Types**
- `Spell` - One-time effects
- `Unit` - Creatures that can attack/block
- `Champion` - Special units with unique abilities
- `Legend` - Powerful legendary units
- `Battlefield` - Environment/terrain cards
- `Gear` - Equipment and artifacts
- `Rune` - Enchantment-like effects
- `Token` - Temporary cards

### **Colors**
- `Fury` - Aggressive, direct damage
- `Body` - Physical strength, combat
- `Mind` - Intelligence, control
- `Calm` - Healing, protection
- `Chaos` - Random effects, disruption
- `Order` - Structure, efficiency
- `Colorless` - Neutral, universal

### **Rarities**
- `Common` - Basic cards, easy to obtain
- `Uncommon` - Slightly better than common
- `Rare` - Powerful effects
- `Epic` - Very powerful, limited availability
- `Overnumbered` - Special rarity

## File Naming Convention

Cards must follow this naming pattern:
- **Format**: `SET_XXX.png`
- **Examples**: 
  - `OGN_001.png` (Origins Main Set, card #001)
  - `OGS_001.png` (Origins Proving Grounds, card #001)

### **Variant Cards**
- **Alt Art Versions**: `SET_XXXa.png` (e.g., `OGN_007a.png`)
- **Signature Versions**: `SET_XXXS.png` (e.g., `OGN_299S.png`)
- **Regular Cards**: `SET_XXX.png` (e.g., `OGN_001.png`)

## Database Collections

- **`cards`** - All card metadata and references
- **`sets`** - Card set information
- **`decks`** - User-created deck compositions

## Troubleshooting

### **Images Not Loading**
- Check that `Riftbound_Cards` directory exists
- Verify file paths in the backend logs
- Ensure PNG files are in the correct set folders

### **MongoDB Connection Issues**
- Verify MongoDB is running on localhost:27017
- Check connection string in `main.py`
- Ensure database `deckbuilder` exists

### **Card Population Errors**
- Run `python run_population.py` to see detailed error messages
- Check that PNG filenames match the expected format
- Verify set folder names match `SETS_INFO` in `populate_cards.py`

## Next Steps

1. **Run the population script** to get all cards into the database
2. **Update card details** using the API endpoints
3. **Test image serving** by accessing `/cards/{set_name}/{filename}`
4. **Build your frontend** to display and manage the cards
5. **Create decks** using the deck building endpoints

## Example Frontend Usage

```typescript
// Get all cards from Origins Main Set
const response = await fetch('/cards/Origins_MainSet');
const { cards } = await response.json();

// Display card image
const imageUrl = `/cards/Origins_MainSet/${card.image_path}`;
<img src={imageUrl} alt={card.name} />

// Filter cards by type
const spells = await fetch('/cards?card_type=Spell&set_code=OGN');

// Filter cards by variant
const altArtCards = await fetch('/cards?variant=alt_art');
const signatureCards = await fetch('/cards?variant=signature');
const regularCards = await fetch('/cards?variant=regular');

// Get all variants of a specific card
const cardVariants = await fetch('/cards?collector_number=001&set_code=OGN');
```

This system gives you a complete card management solution with automatic image serving and flexible metadata storage!
