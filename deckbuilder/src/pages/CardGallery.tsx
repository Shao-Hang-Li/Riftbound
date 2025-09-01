import React, { useState, useEffect } from 'react';
import { Card, CardColor } from '../types/Card';

const CardGallery: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
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
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Fetch cards from MongoDB
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('/cards');
        if (response.ok) {
          const data = await response.json();
          setCards(data.cards || []);
          setFilteredCards(data.cards || []);
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

  // Filter and sort cards
  useEffect(() => {
    let filtered = cards.filter(card => {
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
    });

    // Sort cards
    filtered.sort((a, b) => {
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

    setFilteredCards(filtered);
  }, [cards, searchTerm, selectedSet, selectedType, selectedRarity, selectedColor, selectedCost, sortBy, sortOrder]);

  // Get unique values for filters
  const uniqueSets = ['all', ...Array.from(new Set(cards.map(card => card.set_name)))];
  const uniqueTypes = ['all', ...Array.from(new Set(cards.map(card => card.card_type)))];
  const uniqueRarities = ['all', ...Array.from(new Set(cards.map(card => card.rarity)))];
  const uniqueColors = ['all', ...Array.from(new Set(cards.flatMap(card => card.color || [])))];
  const costOptions = ['all', '0', '1', '2', '3', '4', '5', '6', '7+'];

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
        <h1 className="text-4xl font-bold text-primary mb-2">Card Gallery</h1>
        <p className="text-lg text-base-content/70">Browse and filter all available cards</p>
      </div>

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

      {/* Results Count */}
      <div className="text-center">
        <p className="text-lg">
          Showing {filteredCards.length} of {cards.length} cards
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredCards.map((card) => (
          <div 
            key={card.card_id} 
            className="cursor-pointer transform hover:scale-105 transition-transform duration-200"
            onClick={() => setSelectedCard(card)}
          >
            <img
              src={`/cards/${card.set_name}/${card.image_path}`}
              alt={card.name}
              className="w-full h-auto rounded-lg shadow-lg hover:shadow-xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/300x400?text=Card+Image';
              }}
            />
          </div>
        ))}
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div 
            className="bg-base-100 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col lg:flex-row">
              {/* Left Side - Card Image */}
              <div className="lg:w-1/2 p-6 flex justify-center">
                <img
                  src={`/cards/${selectedCard.set_name}/${selectedCard.image_path}`}
                  alt={selectedCard.name}
                  className="w-full max-w-sm h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/300x400?text=Card+Image';
                  }}
                />
              </div>

              {/* Right Side - Card Details */}
              <div className="lg:w-1/2 p-6 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-primary">{selectedCard.name}</h2>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Card Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-base-content/70">Cost</label>
                    <div className="input input-bordered bg-base-200 text-center font-bold text-lg">
                      {selectedCard.cost}
                    </div>
                  </div>

                  {selectedCard.might && selectedCard.might > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-base-content/70">Might</label>
                      <div className="input input-bordered bg-base-200 text-center font-bold text-lg">
                        {selectedCard.might}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-base-content/70">Type</label>
                    <div className="input input-bordered bg-base-200 text-center">
                      {selectedCard.card_type}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-base-content/70">Rarity</label>
                    <div className={`badge badge-lg ${
                      selectedCard.rarity === 'Common' ? 'badge-ghost' :
                      selectedCard.rarity === 'Uncommon' ? 'badge-info' :
                      selectedCard.rarity === 'Rare' ? 'badge-primary' :
                      selectedCard.rarity === 'Epic' ? 'badge-secondary' :
                      'badge-accent'
                    }`}>
                      {selectedCard.rarity}
                    </div>
                  </div>
                </div>

                {/* Colors */}
                {selectedCard.color && selectedCard.color.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-base-content/70">Colors</label>
                    <div className="flex gap-2">
                      {selectedCard.color.map(color => (
                        <div key={color} className={`badge badge-lg ${
                          color === 'Fury' ? 'badge-error' :
                          color === 'Calm' ? 'badge-info' :
                          color === 'Mind' ? 'badge-accent' :
                          color === 'Body' ? 'badge-success' :
                          color === 'Chaos' ? 'badge-warning' :
                          color === 'Order' ? 'badge-ghost' :
                          'badge-neutral'
                        }`}>
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtypes */}
                {(selectedCard.subtype_1 || selectedCard.subtype_2) && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-base-content/70">Subtypes</label>
                    <div className="flex gap-2">
                      {selectedCard.subtype_1 && (
                        <div className="badge badge-outline badge-lg">
                          {selectedCard.subtype_1}
                        </div>
                      )}
                      {selectedCard.subtype_2 && (
                        <div className="badge badge-outline badge-lg">
                          {selectedCard.subtype_2}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {selectedCard.keywords && selectedCard.keywords.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-base-content/70">Keywords</label>
                    <div className="flex gap-2">
                      {selectedCard.keywords.map(keyword => (
                        <div key={keyword} className="badge badge-primary badge-lg">
                          {keyword}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedCard.description && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-base-content/70">Description</label>
                    <div className="input input-bordered bg-base-200 min-h-[60px] text-sm">
                      {selectedCard.description}
                    </div>
                  </div>
                )}

                {/* Flavor Text */}
                {selectedCard.flavor_text && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-base-content/70">Flavor Text</label>
                    <div className="input input-bordered bg-base-200 min-h-[60px] text-sm italic">
                      "{selectedCard.flavor_text}"
                    </div>
                  </div>
                )}

                {/* Footer Info */}
                <div className="pt-4 border-t border-base-300">
                  <div className="flex justify-between items-center text-sm text-base-content/70">
                    <span>ID: {selectedCard.card_id}</span>
                    {selectedCard.artist && <span>Artist: {selectedCard.artist}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredCards.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No cards found</h3>
          <p className="text-base-content/70">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default CardGallery;
