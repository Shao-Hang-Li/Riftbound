import React, { useState, useEffect } from 'react';
import { Card, Deck, CardType, CardColor } from '../types/Card';
import ErrorModal from '../components/ErrorModal';

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
      "Champion Unit": 0,
      "Signature Unit": 0,
      "Signature Spell": 0,
      Legend: 0,
      Battlefield: 0,
      Gear: 0,
      Rune: 0,
      Token: 0
    }
  });

  // Separate state for special cards (not counted in 40-card limit)
  const [specialCards, setSpecialCards] = useState<{
    battlefield: Card[];
    rune: Card[];
    legend: Card | null;
  }>({
    battlefield: [],
    rune: [],
    legend: null
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSet, setSelectedSet] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedCost, setSelectedCost] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [deckName, setDeckName] = useState('My New Deck');
  const [deckDescription, setDeckDescription] = useState('');
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'success' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  // Fetch cards from MongoDB
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('/cards');
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
          "Champion Unit": 0,
          "Signature Unit": 0,
          "Signature Spell": 0,
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
      "Champion Unit": 0,
      "Signature Unit": 0,
      "Signature Spell": 0,
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

  // Filter and sort cards
  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.card_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.set_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.card_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSet = selectedSet === 'all' || card.set_name === selectedSet;
    const matchesType = selectedType === 'all' || card.card_type === selectedType;
    const matchesRarity = selectedRarity === 'all' || card.rarity === selectedRarity;
    const matchesColor = selectedColor === 'all' || (card.color && card.color.includes(selectedColor as CardColor));
    const matchesCost = selectedCost === 'all' || 
                       (selectedCost === '7+' && card.cost >= 7) ||
                       (selectedCost !== '7+' && card.cost === parseInt(selectedCost));
    
    return matchesSearch && matchesSet && matchesType && matchesRarity && matchesColor && matchesCost;
  }).sort((a, b) => {
    let aValue: any = a[sortBy as keyof Card];
    let bValue: any = b[sortBy as keyof Card];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Get unique values for filters
  const uniqueSets = ['all', ...Array.from(new Set(cards.map(card => card.set_name)))];
  const uniqueTypes = ['all', ...Array.from(new Set(cards.map(card => card.card_type)))];
  const uniqueRarities = ['all', ...Array.from(new Set(cards.map(card => card.rarity)))];
  const uniqueColors = ['all', ...Array.from(new Set(cards.flatMap(card => card.color || [])))];
  const costOptions = ['all', '0', '1', '2', '3', '4', '5', '6', '7+'];

  // Add card to deck
  const addCardToDeck = async (card: Card) => {
    // Handle special card types separately
    if (card.card_type === 'Battlefield') {
      if (specialCards.battlefield.length >= 3) {
        setErrorModal({
          isOpen: true,
          title: 'Battlefield Limit Reached',
          message: 'You must have exactly 3 Battlefield cards.',
          type: 'warning'
        });
        return;
      }
      
      // Check if this card is already in battlefield
      if (specialCards.battlefield.some(c => c.card_id === card.card_id)) {
        setErrorModal({
          isOpen: true,
          title: 'Card Already Added',
          message: 'This Battlefield card is already in your deck.',
          type: 'warning'
        });
        return;
      }
      
      setSpecialCards(prev => ({
        ...prev,
        battlefield: [...prev.battlefield, card]
      }));
      return;
    }

    if (card.card_type === 'Rune') {
      if (specialCards.rune.length >= 12) {
        setErrorModal({
          isOpen: true,
          title: 'Rune Limit Reached',
          message: 'You can have up to 12 Rune cards.',
          type: 'warning'
        });
        return;
      }
      
      // Check if this card is already in rune (max 1 copy)
      if (specialCards.rune.some(c => c.card_id === card.card_id)) {
        setErrorModal({
          isOpen: true,
          title: 'Card Already Added',
          message: 'This Rune card is already in your deck.',
          type: 'warning'
        });
        return;
      }
      
      setSpecialCards(prev => ({
        ...prev,
        rune: [...prev.rune, card]
      }));
      return;
    }

    if (card.card_type === 'Legend') {
      if (specialCards.legend) {
        setErrorModal({
          isOpen: true,
          title: 'Legend Limit Reached',
          message: 'You must have exactly 1 Legend card.',
          type: 'warning'
        });
        return;
      }
      
      setSpecialCards(prev => ({
        ...prev,
        legend: card
      }));
      return;
    }

          // Handle regular cards (Spell, Unit, Champion Unit, Gear, Token)
    if (deck.card_ids.length >= 40) {
      setErrorModal({
        isOpen: true,
        title: 'Deck Full',
        message: 'Deck is full! Maximum 40 cards allowed.',
        type: 'warning'
      });
      return;
    }

    const currentCount = deck.card_ids.filter(id => id === card.card_id).length;
    if (currentCount >= 3) {
      setErrorModal({
        isOpen: true,
        title: 'Maximum Copies Reached',
        message: `Cannot add more than 3 copies of ${card.name}`,
        type: 'warning'
      });
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

  // Remove special card
  const removeSpecialCard = (cardType: 'battlefield' | 'rune' | 'legend', cardId: string) => {
    if (cardType === 'legend') {
      setSpecialCards(prev => ({ ...prev, legend: null }));
    } else {
      setSpecialCards(prev => ({
        ...prev,
        [cardType]: prev[cardType].filter(card => card.card_id !== cardId)
      }));
    }
  };

  // Change card quantity in deck
  const changeCardQuantity = (cardId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    const currentCount = deck.card_ids.filter(id => id === cardId).length;
    let newCardIds = [...deck.card_ids];
    
    if (newQuantity > currentCount) {
      // Add more copies
      const card = cards.find(c => c.card_id === cardId);
      if (card && newQuantity <= 3) {
        const copiesToAdd = newQuantity - currentCount;
        for (let i = 0; i < copiesToAdd; i++) {
          newCardIds.push(cardId);
        }
      }
    } else if (newQuantity < currentCount) {
      // Remove copies
      const copiesToRemove = currentCount - newQuantity;
      for (let i = 0; i < copiesToRemove; i++) {
        const index = newCardIds.indexOf(cardId);
        if (index > -1) {
          newCardIds.splice(index, 1);
        }
      }
    }
    
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
      setErrorModal({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please enter a deck name',
        type: 'warning'
      });
      return;
    }

    // Validate special card requirements
    if (specialCards.battlefield.length !== 3) {
      setErrorModal({
        isOpen: true,
        title: 'Invalid Deck',
        message: 'You must have exactly 3 Battlefield cards.',
        type: 'error'
      });
      return;
    }

         if (!specialCards.legend) {
       setErrorModal({
         isOpen: true,
         title: 'Invalid Deck',
         message: 'You must have exactly 1 Legend card.',
         type: 'error'
       });
       return;
     }

     if (specialCards.rune.length !== 12) {
       setErrorModal({
         isOpen: true,
         title: 'Invalid Deck',
         message: 'You must have exactly 12 Rune cards.',
         type: 'error'
       });
       return;
     }

    if (deck.card_ids.length === 0) {
      setErrorModal({
        isOpen: true,
        title: 'Empty Deck',
        message: 'Please add some cards to your deck',
        type: 'warning'
      });
      return;
    }

    try {
      // Combine regular deck cards with special cards
      const allCardIds = [
        ...deck.card_ids,
        ...specialCards.battlefield.map(c => c.card_id),
        ...specialCards.rune.map(c => c.card_id),
        specialCards.legend.card_id
      ];

      const response = await fetch('/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: deckName,
          description: deckDescription,
          card_ids: allCardIds,
          deck_colors: deck.deck_colors,
          total_cost: deck.total_cost,
          average_cost: deck.average_cost,
          card_type_distribution: deck.card_type_distribution
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setErrorModal({
          isOpen: true,
          title: 'Success!',
          message: 'Deck saved successfully!',
          type: 'success'
        });
                 // Reset deck and special cards
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
          "Champion Unit": 0,
          "Signature Unit": 0,
          "Signature Spell": 0,
          Legend: 0,
          Battlefield: 0,
          Gear: 0,
          Rune: 0,
          Token: 0
        }
         };
         setDeck(resetDeck);
         setSpecialCards({
           battlefield: [],
           rune: [],
           legend: null
         });
         setDeckName('My New Deck');
         setDeckDescription('');
      } else {
        const errorData = await response.json();
        setErrorModal({
          isOpen: true,
          title: 'Error Saving Deck',
          message: `Error saving deck: ${errorData.error}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving deck:', error);
      setErrorModal({
        isOpen: true,
        title: 'Network Error',
        message: 'Failed to save deck. Please check your connection.',
        type: 'error'
      });
    }
  };

  // Get deck cards with full details and count
  const deckCardsWithCount = deck.card_ids.reduce((acc, cardId) => {
    const card = cards.find(card => card.card_id === cardId);
    if (card) {
      const existing = acc.find(item => item.card.card_id === cardId);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ card, count: 1 });
      }
    }
    return acc;
  }, [] as { card: Card; count: number }[]);

  // Handle card hover for preview
  const handleCardHover = (card: Card) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    const timeout = setTimeout(() => {
      setHoveredCard(card);
    }, 1500); // 1.5 second delay
    
    setHoverTimeout(timeout);
  };

  const handleCardLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setHoveredCard(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  const closeErrorModal = () => {
    setErrorModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Deck Builder</h1>
                 <p className="text-lg text-base-content/70">Build your perfect deck (40 main cards + 3 Battlefield + 1 Legend + 12 Rune)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Card Browser */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Filters */}
          <div className="bg-base-200 p-4 rounded-lg space-y-3">
            {/* Top Row - Search Bar with Set, Color, Cost */}
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search Cards by Name, ID, set, type etc"
                  className="input input-bordered w-full pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              
              <select
                className="select select-bordered min-w-32"
                value={selectedSet}
                onChange={(e) => setSelectedSet(e.target.value)}
              >
                <option value="all">Any Set</option>
                {uniqueSets.filter(set => set !== 'all').map(set => (
                  <option key={set} value={set}>{set}</option>
                ))}
              </select>

              <select
                className="select select-bordered min-w-32"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
              >
                <option value="all">Any Color</option>
                {uniqueColors.filter(color => color !== 'all').map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>

              <select
                className="select select-bordered min-w-32"
                value={selectedCost}
                onChange={(e) => setSelectedCost(e.target.value)}
              >
                <option value="all">Any Cost</option>
                {costOptions.filter(cost => cost !== 'all').map(cost => (
                  <option key={cost} value={cost}>{cost}</option>
                ))}
              </select>

              <button 
                className="btn btn-square"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </button>
            </div>

            {/* Bottom Row - Additional Filters (Collapsible) */}
            {showAdvancedFilters && (
              <div className="flex gap-3 items-center">
                <select
                  className="select select-bordered min-w-36"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="all">Any Card Type</option>
                  {uniqueTypes.filter(type => type !== 'all').map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  className="select select-bordered min-w-32"
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                >
                  <option value="all">Any Rarity</option>
                  {uniqueRarities.filter(rarity => rarity !== 'all').map(rarity => (
                    <option key={rarity} value={rarity}>{rarity}</option>
                  ))}
                </select>

                <div className="flex gap-2 ml-auto">
                  <span className="text-sm self-center">Sort By:</span>
                  <select
                    className="select select-bordered select-sm min-w-24"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Default</option>
                    <option value="cost">Cost</option>
                    <option value="rarity">Rarity</option>
                    <option value="card_type">Type</option>
                  </select>

                  <span className="text-sm self-center">Order By:</span>
                  <select
                    className="select select-bordered select-sm min-w-20"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  >
                    <option value="asc">ASC</option>
                    <option value="desc">DESC</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredCards.map((card) => {
              const currentCount = deck.card_ids.filter(id => id === card.card_id).length;
              const isMaxCopies = currentCount >= 3;
              
              return (
                <div 
                  key={card.card_id} 
                  className={`card shadow-lg transition-shadow border-2 ${
                    isMaxCopies 
                      ? 'bg-base-300 opacity-50 cursor-not-allowed border-gray-400' 
                      : 'bg-base-100 hover:shadow-xl cursor-pointer border-transparent hover:border-primary'
                  }`}
                  onClick={() => !isMaxCopies && addCardToDeck(card)}
                  onMouseEnter={() => !isMaxCopies && handleCardHover(card)}
                  onMouseLeave={handleCardLeave}
                  title={isMaxCopies ? `${card.name} - Maximum copies reached (3)` : `Click to add ${card.name} to deck`}
                >
                <figure className="px-2 pt-2">
                                  <img
                  src={`/image/${card.set_name}/${card.image_path}`}
                  alt={card.name}
                  className="rounded-lg w-full h-auto object-contain"
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
                     {currentCount > 0 && (
                       <div className="badge badge-secondary badge-sm">x{currentCount}</div>
                     )}
                   </div>
                 </div>
              </div>
              );
            })}
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

                     {/* Special Cards Section */}
           <div className="bg-base-200 p-4 rounded-lg space-y-4">
             <h3 className="text-lg font-semibold">Special Cards</h3>
             
             {/* Battlefield Cards - Must have exactly 3 */}
             <div>
               <h4 className="font-medium text-sm mb-2">
                 Battlefield Cards ({specialCards.battlefield.length}/3)
                 <span className="text-error ml-2">*Required</span>
               </h4>
               {specialCards.battlefield.length === 0 ? (
                 <div className="text-center py-4 text-base-content/50 text-sm">
                   Add 3 Battlefield cards
                 </div>
               ) : (
                 <div className="space-y-2">
                   {specialCards.battlefield.map((card) => (
                     <div key={card.card_id} className="flex items-center gap-2 p-2 bg-base-100 rounded-lg">
                       <img
                         src={`/image/${card.set_name}/${card.image_path}`}
                         alt={card.name}
                         className="w-10 h-12 object-cover rounded"
                         onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.src = 'https://via.placeholder.com/40x48?text=Card';
                         }}
                       />
                       <div className="flex-1 min-w-0">
                         <h5 className="font-semibold text-xs truncate">{card.name}</h5>
                         {card.cost !== undefined && card.cost !== null && (
                           <p className="text-xs text-base-content/50">Cost: {card.cost}</p>
                         )}
                       </div>
                       <button
                         className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
                         onClick={() => removeSpecialCard('battlefield', card.card_id)}
                         title="Remove Battlefield card"
                       >
                         ✕
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {/* Legend Card - Must have exactly 1 */}
             <div>
               <h4 className="font-medium text-sm mb-2">
                 Legend Card ({specialCards.legend ? '1' : '0'}/1)
                 <span className="text-error ml-2">*Required</span>
               </h4>
               {!specialCards.legend ? (
                 <div className="text-center py-4 text-base-content/50 text-sm">
                   Add 1 Legend card
                 </div>
               ) : (
                 <div className="flex items-center gap-2 p-2 bg-base-100 rounded-lg">
                   <img
                     src={`/image/${specialCards.legend.set_name}/${specialCards.legend.image_path}`}
                     alt={specialCards.legend.name}
                     className="w-10 h-12 object-cover rounded"
                     onError={(e) => {
                       const target = e.target as HTMLImageElement;
                       target.src = 'https://via.placeholder.com/40x48?text=Card';
                     }}
                   />
                   <div className="flex-1 min-w-0">
                     <h5 className="font-semibold text-xs truncate">{specialCards.legend.name}</h5>
                     {specialCards.legend.cost !== undefined && specialCards.legend.cost !== null && (
                       <p className="text-xs text-base-content/50">Cost: {specialCards.legend.cost}</p>
                     )}
                   </div>
                   <button
                     className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
                     onClick={() => removeSpecialCard('legend', specialCards.legend!.card_id)}
                     title="Remove Legend card"
                   >
                     ✕
                   </button>
                 </div>
               )}
             </div>

             {/* Rune Cards - Must have exactly 12 */}
             <div>
               <h4 className="font-medium text-sm mb-2">
                 Rune Cards ({specialCards.rune.length}/12)
                 <span className="text-error ml-2">*Required</span>
               </h4>
               {specialCards.rune.length === 0 ? (
                 <div className="text-center py-4 text-base-content/50 text-sm">
                   Add exactly 12 Rune cards
                 </div>
               ) : (
                 <div className="space-y-2 max-h-32 overflow-y-auto">
                   {specialCards.rune.map((card) => (
                     <div key={card.card_id} className="flex items-center gap-2 p-2 bg-base-100 rounded-lg">
                       <img
                         src={`/image/${card.set_name}/${card.image_path}`}
                         alt={card.name}
                         className="w-10 h-12 object-cover rounded"
                         onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.src = 'https://via.placeholder.com/40x48?text=Card';
                         }}
                       />
                       <div className="flex-1 min-w-0">
                         <h5 className="font-semibold text-xs truncate">{card.name}</h5>
                         {card.cost !== undefined && card.cost !== null && (
                           <p className="text-xs text-base-content/50">Cost: {card.cost}</p>
                         )}
                       </div>
                       <button
                         className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
                         onClick={() => removeSpecialCard('rune', card.card_id)}
                         title="Remove Rune card"
                       >
                         ✕
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>

           {/* Current Deck */}
           <div className="bg-base-200 p-4 rounded-lg">
             <h3 className="text-lg font-semibold mb-3">Main Deck ({deck.card_ids.length}/40)</h3>
            
            {deckCardsWithCount.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <div className="text-4xl mb-2">🃏</div>
                <p>No cards in deck</p>
                <p className="text-sm">Click on cards to add them</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {deckCardsWithCount.map(({ card, count }) => (
                  <div key={card.card_id} className="flex items-center gap-2 p-2 bg-base-100 rounded-lg">
                    <img
                      src={`/image/${card.set_name}/${card.image_path}`}
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
                      {card.cost !== undefined && card.cost !== null && (
                        <p className="text-xs text-base-content/50">Cost: {card.cost}</p>
                      )}
                    </div>
                                         <div className="flex items-center gap-2">
                       {/* Quantity Controls */}
                       <div className="flex items-center gap-1">
                         <button
                           className="btn btn-ghost btn-xs text-base-content/70 hover:text-base-content"
                           onClick={() => changeCardQuantity(card.card_id, count - 1)}
                           disabled={count <= 1}
                           title="Decrease quantity"
                         >
                           -
                         </button>
                         <span className="badge badge-primary badge-sm min-w-[2rem]">{count}</span>
                         <button
                           className="btn btn-ghost btn-xs text-base-content/70 hover:text-base-content"
                           onClick={() => changeCardQuantity(card.card_id, count + 1)}
                           disabled={count >= 3}
                           title="Increase quantity"
                         >
                           +
                         </button>
                       </div>
                       {/* Delete Button */}
                       <button
                         className="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content"
                         onClick={() => removeCardFromDeck(card.card_id)}
                         title="Remove all copies"
                       >
                         🗑️
                       </button>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Hover Preview Modal */}
      {hoveredCard && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-base-100 rounded-lg shadow-2xl border-2 border-primary p-4 max-w-sm">
              <img
                src={`/cards/${hoveredCard.set_name}/${hoveredCard.image_path}`}
                alt={hoveredCard.name}
                className="w-64 h-auto rounded-lg shadow-lg object-contain"
                style={{ maxWidth: '256px', height: 'auto' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/300x400?text=Card+Image';
                }}
              />
              <div className="mt-2 text-center">
                <h3 className="font-bold text-sm">{hoveredCard.name}</h3>
                <p className="text-xs text-base-content/70">{hoveredCard.card_type}</p>
                {hoveredCard.cost !== undefined && hoveredCard.cost !== null && (
                  <p className="text-xs text-base-content/50">Cost: {hoveredCard.cost}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={closeErrorModal}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
      />
    </div>
  );
};

export default DeckBuilder;
