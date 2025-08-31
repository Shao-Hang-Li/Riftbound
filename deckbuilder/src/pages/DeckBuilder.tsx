import React, { useState, useEffect } from 'react';
import { Card, Deck, CardType, CardColor } from '../types/Card';

const DeckBuilder: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Deck>({
    name: '',
    description: '',
    card_ids: [],
    deck_colors: [],
    total_cost: 0,
    average_cost: 0,
    card_type_distribution: {
      Spell: 0,
      Unit: 0,
      Champion: 0,
      Legend: 0,
      Battlefield: 0,
      Gear: 0,
      Rune: 0,
      Token: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSet, setSelectedSet] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [deckName, setDeckName] = useState('My New Deck');
  const [deckDescription, setDeckDescription] = useState('');

  // Fetch cards from MongoDB
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('http://localhost:8000/cards');
        if (response.ok) {
          const data = await response.json();
          setCards(data.cards || []);
        } else {
          console.error('Failed to fetch cards');
        }
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  // Calculate deck statistics
  const calculateDeckStats = (cardIds: string[]): Partial<Deck> => {
    const deckCards = cardIds.map(cardId => 
      cards.find(card => card.card_id === cardId)
    ).filter(Boolean) as Card[];

    if (deckCards.length === 0) {
      return {
        deck_colors: [],
        total_cost: 0,
        average_cost: 0,
        card_type_distribution: {
          Spell: 0,
          Unit: 0,
          Champion: 0,
          Legend: 0,
          Battlefield: 0,
          Gear: 0,
          Rune: 0,
          Token: 0
        }
      };
    }

    // Calculate colors
    const allColors = deckCards.flatMap(card => card.color);
    const uniqueColors = Array.from(new Set(allColors));

    // Calculate costs
    const totalCost = deckCards.reduce((sum, card) => sum + card.cost, 0);
    const averageCost = totalCost / deckCards.length;

    // Calculate type distribution
    const typeDistribution = {
      Spell: 0,
      Unit: 0,
      Champion: 0,
      Legend: 0,
      Battlefield: 0,
      Gear: 0,
      Rune: 0,
      Token: 0
    };

    deckCards.forEach(card => {
      if (typeDistribution.hasOwnProperty(card.card_type)) {
        typeDistribution[card.card_type as CardType]++;
      }
    });

    return {
      deck_colors: uniqueColors,
      total_cost: totalCost,
      average_cost: Math.round(averageCost * 100) / 100,
      card_type_distribution: typeDistribution
    };
  };

  // Filter cards
  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.card_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.set_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.card_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSet = selectedSet === 'all' || card.set_name === selectedSet;
    const matchesType = selectedType === 'all' || card.card_type === selectedType;
    
    return matchesSearch && matchesSet && matchesType;
  });

  // Get unique sets and types for filters
  const uniqueSets = ['all', ...Array.from(new Set(cards.map(card => card.set_name)))];
  const uniqueTypes = ['all', ...Array.from(new Set(cards.map(card => card.card_type)))];

  // Add card to deck
  const addCardToDeck = async (card: Card) => {
    if (deck.card_ids.length >= 40) {
      alert('Deck is full! Maximum 40 cards allowed.');
      return;
    }

    const currentCount = deck.card_ids.filter(id => id === card.card_id).length;
    if (currentCount >= 3) {
      alert(`Cannot add more than 3 copies of ${card.name}`);
      return;
    }

    const newCardIds = [...deck.card_ids, card.card_id];
    const newDeck = {
      ...deck,
      card_ids: newCardIds,
      ...calculateDeckStats(newCardIds)
    };
    setDeck(newDeck);
  };

  // Remove card from deck
  const removeCardFromDeck = (cardId: string) => {
    const newCardIds = deck.card_ids.filter(id => id !== cardId);
    const newDeck = {
      ...deck,
      card_ids: newCardIds,
      ...calculateDeckStats(newCardIds)
    };
    setDeck(newDeck);
  };

  // Save deck
  const saveDeck = async () => {
    if (!deckName.trim()) {
      alert('Please enter a deck name');
      return;
    }

    if (deck.card_ids.length === 0) {
      alert('Please add some cards to your deck');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: deckName,
          description: deckDescription,
          card_ids: deck.card_ids,
          deck_colors: deck.deck_colors,
          total_cost: deck.total_cost,
          average_cost: deck.average_cost,
          card_type_distribution: deck.card_type_distribution
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Deck saved successfully!');
        // Reset deck
        const resetDeck = {
          name: '',
          description: '',
          card_ids: [],
          deck_colors: [],
          total_cost: 0,
          average_cost: 0,
          card_type_distribution: {
            Spell: 0,
            Unit: 0,
            Champion: 0,
            Legend: 0,
            Battlefield: 0,
            Gear: 0,
            Rune: 0,
            Token: 0
          }
        };
        setDeck(resetDeck);
        setDeckName('My New Deck');
        setDeckDescription('');
      } else {
        const errorData = await response.json();
        alert(`Error saving deck: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving deck:', error);
      alert('Failed to save deck');
    }
  };

  // Get deck cards with full details
  const deckCards = deck.card_ids.map(cardId => 
    cards.find(card => card.card_id === cardId)
  ).filter(Boolean) as Card[];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Deck Builder</h1>
        <p className="text-lg text-base-content/70">Build your perfect deck (Max 40 cards, Max 3 copies per card)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Card Browser */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Filters */}
          <div className="bg-base-200 p-4 rounded-lg space-y-4">
            <div className="form-control">
              <input
                type="text"
                placeholder="Search cards..."
                className="input input-bordered w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Set</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                >
                  {uniqueSets.map(set => (
                    <option key={set} value={set}>
                      {set === 'all' ? 'All Sets' : set}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Type</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredCards.map((card) => (
              <div 
                key={card.card_id} 
                className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-primary"
                onClick={() => addCardToDeck(card)}
                title={`Click to add ${card.name} to deck`}
              >
                <figure className="px-2 pt-2">
                  <img
                    src={`http://localhost:8000/image/${card.set_name}/${card.image_path}`}
                    alt={card.name}
                    className="rounded-lg w-full h-32 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/200x250?text=Card';
                    }}
                  />
                </figure>
                <div className="card-body p-2">
                  <h3 className="card-title text-xs font-bold truncate">{card.name}</h3>
                  <p className="text-xs text-base-content/70">{card.card_type}</p>
                  <div className="card-actions justify-end mt-1">
                    <div className="badge badge-primary badge-sm">{card.card_id}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Deck */}
        <div className="space-y-4">
          {/* Deck Info */}
          <div className="bg-base-200 p-4 rounded-lg space-y-3">
            <h3 className="text-lg font-semibold">Deck Information</h3>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Deck Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Enter deck name"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                placeholder="Enter deck description"
                rows={3}
              />
            </div>

            {/* Deck Statistics */}
            <div className="stats stats-vertical shadow">
              <div className="stat">
                <div className="stat-title">Total Cards</div>
                <div className="stat-value">{deck.card_ids.length}</div>
                <div className="stat-desc">/ 40 maximum</div>
              </div>
              <div className="stat">
                <div className="stat-title">Total Cost</div>
                <div className="stat-value">{deck.total_cost}</div>
                <div className="stat-desc">Average: {deck.average_cost}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Colors</div>
                <div className="stat-value">{deck.deck_colors.length}</div>
                <div className="stat-desc">{deck.deck_colors.join(', ') || 'None'}</div>
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={saveDeck}
              disabled={deck.card_ids.length === 0 || !deckName.trim()}
            >
              Save Deck
            </button>
          </div>

          {/* Current Deck */}
          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Current Deck</h3>
            
            {deckCards.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <div className="text-4xl mb-2">🃏</div>
                <p>No cards in deck</p>
                <p className="text-sm">Click on cards to add them</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {deckCards.map((card, index) => (
                  <div key={`${card.card_id}-${index}`} className="flex items-center gap-2 p-2 bg-base-100 rounded-lg">
                    <img
                      src={`http://localhost:8000/image/${card.set_name}/${card.image_path}`}
                      alt={card.name}
                      className="w-12 h-16 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/48x64?text=Card';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{card.name}</h4>
                      <p className="text-xs text-base-content/70">{card.card_type}</p>
                      <p className="text-xs text-base-content/50">Cost: {card.cost}</p>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm text-error"
                      onClick={() => removeCardFromDeck(card.card_id)}
                      title="Remove card"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckBuilder;
