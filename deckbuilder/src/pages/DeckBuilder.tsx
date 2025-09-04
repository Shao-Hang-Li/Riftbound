import React from 'react';
import { Card } from '../types';
import { CardsProvider, useCards } from '../context/CardsContext';
import { DeckProvider, useDeck } from '../context/DeckContext';
import { useErrorModal } from '../hooks/useErrorModal';
import { useCardHover } from '../hooks/useCardHover';
import FilterBar from '../components/FilterBar';
import DeckStats from '../components/DeckStats';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorModal from '../components/ErrorModal';

const DeckBuilderContent: React.FC = () => {
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

  const {
    deck,
    specialCards,
    deckName,
    setDeckName,
    deckDescription,
    setDeckDescription,
    addCardToDeck,
    removeCardFromDeck,
    removeSpecialCard,
    changeCardQuantity,
    changeRuneQuantity,
    removeAllRuneCopies,
    saveDeck,
    getCardCount,
    isCardDisabled,
    getDeckCardsWithCount
  } = useDeck();

  const { errorModal, closeError } = useErrorModal();
  const { hoveredCard, handleCardHover, handleCardLeave } = useCardHover();

  const handleAddCard = async (card: Card) => {
    await addCardToDeck(card);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

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

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredCards.map((card) => {
              // Calculate count for regular cards
              let currentCount = getCardCount(card);
              let isMaxCopies = isCardDisabled(card);
              
              return (
                <div 
                  key={card.card_id} 
                  className={`card shadow-lg transition-shadow border-2 ${
                    isMaxCopies 
                      ? 'bg-base-300 opacity-50 cursor-not-allowed border-gray-400' 
                      : 'bg-base-100 hover:shadow-xl cursor-pointer border-transparent hover:border-primary'
                  }`}
                  onClick={() => !isMaxCopies && handleAddCard(card)}
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
            <DeckStats deck={deck} showVertical={true} />

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
                  {specialCards.battlefield.map((card: Card) => (
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
                        ×
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
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Rune Cards - Exactly 12 required */}
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
                  {(() => {
                    // Group rune cards by card_id and count them
                    const runeCardsWithCount = specialCards.rune.reduce((acc: { card: Card; count: number }[], card: Card) => {
                      const existing = acc.find((item: { card: Card; count: number }) => item.card.card_id === card.card_id);
                      if (existing) {
                        existing.count++;
                      } else {
                        acc.push({ card, count: 1 });
                      }
                      return acc;
                    }, [] as { card: Card; count: number }[]);

                    return runeCardsWithCount.map(({ card, count }: { card: Card; count: number }) => (
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
                        <div className="flex items-center gap-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <button
                              className="btn btn-ghost btn-xs text-base-content/70 hover:text-base-content"
                              onClick={() => changeRuneQuantity(card.card_id, count - 1)}
                              disabled={count <= 1}
                              title="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="badge badge-primary badge-sm min-w-[2rem]">{count}</span>
                            <button
                              className="btn btn-ghost btn-xs text-base-content/70 hover:text-base-content"
                              onClick={() => changeRuneQuantity(card.card_id, count + 1)}
                              disabled={specialCards.rune.length >= 12}
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          {/* Delete Button */}
                          <button
                            className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
                            onClick={() => removeAllRuneCopies(card.card_id)}
                            title="Remove all copies"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Current Deck */}
          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Main Deck ({deck.card_ids.length}/40)</h3>
           
            {getDeckCardsWithCount().length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <p>No cards in deck</p>
                <p className="text-sm">Click on cards to add them</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getDeckCardsWithCount().map(({ card, count }: { card: Card; count: number }) => (
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
                        Delete
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
        onClose={closeError}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
      />
    </div>
  );
};

const DeckBuilder: React.FC = () => {
  return (
    <CardsProvider>
      <DeckBuilderWithDeck />
    </CardsProvider>
  );
};

const DeckBuilderWithDeck: React.FC = () => {
  const { cards } = useCards();
  const { showError } = useErrorModal();

  return (
    <DeckProvider cards={cards} onError={showError}>
      <DeckBuilderContent />
    </DeckProvider>
  );
};

export default DeckBuilder;
