import React from 'react';
import { Card, CardColor } from '../types';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedSet: string;
  onSetChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedRarity: string;
  onRarityChange: (value: string) => void;
  selectedColor: string;
  onColorChange: (value: string) => void;
  selectedCost: string;
  onCostChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  cards: Card[];
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedSet,
  onSetChange,
  selectedType,
  onTypeChange,
  selectedRarity,
  onRarityChange,
  selectedColor,
  onColorChange,
  selectedCost,
  onCostChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  cards
}) => {
  // Get unique values for filters
  const uniqueSets = ['all', ...Array.from(new Set(cards.map(card => card.set_name)))];
  const uniqueTypes = ['all', ...Array.from(new Set(cards.map(card => card.card_type)))];
  const uniqueRarities = ['all', ...Array.from(new Set(cards.map(card => card.rarity)))];
  const uniqueColors = ['all', ...Array.from(new Set(cards.flatMap(card => card.color || [])))];
  const costOptions = ['all', '0', '1', '2', '3', '4', '5', '6', '7+'];

  return (
    <div className="bg-base-200 p-4 rounded-lg space-y-3">
      {/* Top Row - Search Bar with Set, Color, Cost */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search Cards by Name, ID, set, type etc"
            className="input input-bordered w-full pr-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
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
          onChange={(e) => onSetChange(e.target.value)}
        >
          <option value="all">Any Set</option>
          {uniqueSets.filter(set => set !== 'all').map(set => (
            <option key={set} value={set}>{set}</option>
          ))}
        </select>

        <select
          className="select select-bordered min-w-32"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
        >
          <option value="all">Any Color</option>
          {uniqueColors.filter(color => color !== 'all').map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>

        <select
          className="select select-bordered min-w-32"
          value={selectedCost}
          onChange={(e) => onCostChange(e.target.value)}
        >
          <option value="all">Any Cost</option>
          {costOptions.filter(cost => cost !== 'all').map(cost => (
            <option key={cost} value={cost}>{cost}</option>
          ))}
        </select>

        <button 
          className="btn btn-square"
          onClick={onToggleAdvancedFilters}
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
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="all">Any Card Type</option>
            {uniqueTypes.filter(type => type !== 'all').map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            className="select select-bordered min-w-32"
            value={selectedRarity}
            onChange={(e) => onRarityChange(e.target.value)}
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
              onChange={(e) => onSortByChange(e.target.value)}
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
              onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">ASC</option>
              <option value="desc">DESC</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
