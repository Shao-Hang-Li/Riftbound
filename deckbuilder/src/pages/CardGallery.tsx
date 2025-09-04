import React, { useState } from 'react';
import { Card } from '../types';
import { CardsProvider, useCards } from '../context/CardsContext';
import FilterBar from '../components/FilterBar';
import CardImage from '../components/CardImage';
import CardDetailModal from '../components/CardDetailModal';
import LoadingSpinner from '../components/LoadingSpinner';

const CardGalleryContent: React.FC = () => {
  const {
    cards,
    loading,
    filteredCards,
    searchTerm,
    setSearchTerm,
    selectedSet,
    setSelectedSet,
    selectedType,
    setSelectedType,
    selectedRarity,
    setSelectedRarity,
    selectedColor,
    setSelectedColor,
    selectedCost,
    setSelectedCost,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    showAdvancedFilters,
    setShowAdvancedFilters
  } = useCards();

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Card Gallery</h1>
        <p className="text-lg text-base-content/70">Browse and filter all available cards</p>
      </div>

      {/* Search and Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedSet={selectedSet}
        onSetChange={setSelectedSet}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedRarity={selectedRarity}
        onRarityChange={setSelectedRarity}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        selectedCost={selectedCost}
        onCostChange={setSelectedCost}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
        cards={cards}
      />

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
            <CardImage
              card={card}
              size="gallery"
              className="w-full h-auto rounded-lg shadow-lg hover:shadow-xl"
            />
          </div>
        ))}
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />

      {/* No Results */}
      {filteredCards.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No cards found</h3>
          <p className="text-base-content/70">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

const CardGallery: React.FC = () => {
  return (
    <CardsProvider>
      <CardGalleryContent />
    </CardsProvider>
  );
};

export default CardGallery;
