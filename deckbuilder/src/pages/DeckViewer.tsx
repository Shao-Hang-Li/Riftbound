import React, { useState, useEffect } from 'react';
import { Card, Deck } from '../types';
import { CardsProvider, useCards } from '../context/CardsContext';
import { useErrorModal } from '../hooks/useErrorModal';
import { deckService } from '../services/deckService';
import CardImage from '../components/CardImage';
import DeckStats from '../components/DeckStats';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorModal from '../components/ErrorModal';

interface SavedDeck extends Deck {
  _id: string;
  created_at: string;
  updated_at: string;
}

const DeckViewerContent: React.FC = () => {
  const { cards: allCards, loading: cardsLoading } = useCards();
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<SavedDeck | null>(null);
  const { errorModal, showError, closeError } = useErrorModal();

  // Fetch saved decks
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const decks = await deckService.getDecks();
        setSavedDecks(decks);
      } catch (error) {
        console.error('Error fetching decks:', error);
        showError('Error', 'Failed to fetch saved decks', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [showError]);

  // Get deck cards with full details and count
  const getDeckCardsWithCount = (deck: SavedDeck) => {
    return deck.card_ids.reduce((acc, cardId) => {
      const card = allCards.find(card => card.card_id === cardId);
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
  };

  // Get deck card counts by type
  const getDeckCardCounts = (deck: SavedDeck) => {
    const regularCards = [];
    const battlefieldCards = [];
    const legendCards = [];
    const runeCards = [];

    for (const cardId of deck.card_ids) {
      const card = allCards.find(card => card.card_id === cardId);
      if (card) {
        const cardType = card.card_type;
        if (cardType === "Battlefield") {
          battlefieldCards.push(cardId);
        } else if (cardType === "Legend") {
          legendCards.push(cardId);
        } else if (cardType === "Rune") {
          runeCards.push(cardId);
        } else {
          regularCards.push(cardId);
        }
      }
    }

    return {
      regular: regularCards.length,
      battlefield: battlefieldCards.length,
      legend: legendCards.length,
      rune: runeCards.length
    };
  };

  // Delete a deck
  const deleteDeck = async (deckId: string) => {
    if (!window.confirm('Are you sure you want to delete this deck?')) {
      return;
    }

    try {
      await deckService.deleteDeck(deckId);
      setSavedDecks(savedDecks.filter(deck => deck._id !== deckId));
      if (selectedDeck?._id === deckId) {
        setSelectedDeck(null);
      }
      showError('Success!', 'Deck deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting deck:', error);
      showError('Network Error', 'Failed to delete deck. Please check your connection.', 'error');
    }
  };

  if (loading || cardsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Deck Viewer</h1>
        <p className="text-lg text-base-content/70">View and manage your saved decks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Deck List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Saved Decks</h3>
            
            {savedDecks.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <p>No saved decks</p>
                <p className="text-sm">Create a deck in the Deck Builder</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedDecks.map((deck) => (
                  <div 
                    key={deck._id} 
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDeck?._id === deck._id 
                        ? 'bg-primary text-primary-content' 
                        : 'bg-base-100 hover:bg-base-300'
                    }`}
                    onClick={() => setSelectedDeck(deck)}
                  >
                    <h4 className="font-semibold text-sm truncate">{deck.name}</h4>
                    {(() => {
                      const counts = getDeckCardCounts(deck);
                      return (
                        <p className="text-xs opacity-70">
                          {counts.regular}/40, {counts.battlefield}/3, {counts.legend}/1, {counts.rune}/12
                        </p>
                      );
                    })()}
                    <p className="text-xs opacity-50">
                      {new Date(deck.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Deck Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDeck ? (
            <>
              {/* Deck Info */}
              <div className="bg-base-200 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedDeck.name}</h3>
                    {selectedDeck.description && (
                      <p className="text-base-content/70 mt-1">{selectedDeck.description}</p>
                    )}
                  </div>
                  <button
                    className="btn btn-error btn-sm"
                    onClick={() => deleteDeck(selectedDeck._id)}
                    title="Delete deck"
                  >
                    Delete
                  </button>
                </div>

                {/* Deck Statistics */}
                {(() => {
                  const counts = getDeckCardCounts(selectedDeck);
                  return (
                    <div className="stats stats-horizontal shadow">
                      <div className="stat">
                        <div className="stat-title">Main Deck</div>
                        <div className="stat-value">{counts.regular}</div>
                        <div className="stat-desc">/ 40 cards</div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">Battlefield</div>
                        <div className="stat-value">{counts.battlefield}</div>
                        <div className="stat-desc">/ 3 cards</div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">Legend</div>
                        <div className="stat-value">{counts.legend}</div>
                        <div className="stat-desc">/ 1 card</div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">Rune</div>
                        <div className="stat-value">{counts.rune}</div>
                        <div className="stat-desc">/ 12 cards</div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">Average Cost</div>
                        <div className="stat-value">{selectedDeck.average_cost}</div>
                        <div className="stat-desc">per card</div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">Colors</div>
                        <div className="stat-value">{selectedDeck.deck_colors.length}</div>
                        <div className="stat-desc">{selectedDeck.deck_colors.join(', ') || 'None'}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Deck Cards */}
              <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Deck Cards</h3>
                
                {(() => {
                  const deckCardsWithCount = getDeckCardsWithCount(selectedDeck);
                  return deckCardsWithCount.length === 0 ? (
                    <div className="text-center py-8 text-base-content/70">
                      <p>No cards in this deck</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {deckCardsWithCount.map(({ card, count }) => (
                        <div key={card.card_id} className="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
                          <CardImage card={card} size="large" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{card.name}</h4>
                            <p className="text-xs text-base-content/70">{card.card_type}</p>
                            {card.cost !== undefined && card.cost !== null && (
                              <p className="text-xs text-base-content/50">Cost: {card.cost}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="badge badge-primary badge-sm min-w-[2rem]">x{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          ) : (
            <div className="bg-base-200 p-8 rounded-lg text-center">
              <h3 className="text-xl font-semibold mb-2">Select a Deck</h3>
              <p className="text-base-content/70">Choose a deck from the list to view its details</p>
            </div>
          )}
        </div>
      </div>

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

const DeckViewer: React.FC = () => {
  return (
    <CardsProvider>
      <DeckViewerContent />
    </CardsProvider>
  );
};

export default DeckViewer;
