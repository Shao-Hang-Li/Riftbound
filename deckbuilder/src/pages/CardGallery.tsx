import React, { useState, useEffect } from 'react';
import { Card } from '../types/Card';

const CardGallery: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSet, setSelectedSet] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch cards from MongoDB
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('http://localhost:8000/cards');
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
      
      return matchesSearch && matchesSet && matchesType;
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
  }, [cards, searchTerm, selectedSet, selectedType, sortBy, sortOrder]);

  // Get unique sets and types for filters
  const uniqueSets = ['all', ...Array.from(new Set(cards.map(card => card.set_name)))];
  const uniqueTypes = ['all', ...Array.from(new Set(cards.map(card => card.card_type)))];

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
      <div className="bg-base-200 p-6 rounded-lg space-y-4">
        {/* Search Bar */}
        <div className="form-control">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search cards by name, ID, set, type..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-square">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="form-control">
            <label className="label">
              <span className="label-text">Sort By</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="card_id">Card ID</option>
              <option value="set_name">Set</option>
              <option value="card_type">Type</option>
            </select>
          </div>
        </div>

        {/* Sort Order */}
        <div className="flex justify-center">
          <div className="btn-group">
            <button
              className={`btn ${sortOrder === 'asc' ? 'btn-active' : ''}`}
              onClick={() => setSortOrder('asc')}
            >
              Ascending
            </button>
            <button
              className={`btn ${sortOrder === 'desc' ? 'btn-active' : ''}`}
              onClick={() => setSortOrder('desc')}
            >
              Descending
            </button>
          </div>
        </div>
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
          <div key={card.card_id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
            <figure className="px-4 pt-4">
              <img
                src={`http://localhost:8000/cards/${card.set_name}/${card.image_path}`}
                alt={card.name}
                className="rounded-xl w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/300x400?text=Card+Image';
                }}
              />
            </figure>
            <div className="card-body p-4">
              <h2 className="card-title text-sm font-bold">{card.name}</h2>
              <p className="text-xs text-base-content/70">{card.card_type}</p>
              <p className="text-xs text-base-content/50">{card.set_name}</p>
              <div className="card-actions justify-end mt-2">
                <div className="badge badge-primary">{card.card_id}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
