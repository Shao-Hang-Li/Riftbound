import React, { useState, useEffect } from 'react';
import { Card, Deck } from '../types/Card';
import ErrorModal from '../components/ErrorModal';

interface SavedDeck extends Deck {
  _id: string;
  created_at: string;
  updated_at: string;
}

const DeckViewer: React.FC = () => {
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<SavedDeck | null>(null);
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

  // Fetch saved decks and all cards
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch saved decks
        const decksResponse = await fetch('/decks');
        if (decksResponse.ok) {
          const decksData = await decksResponse.json();
          setSavedDecks(decksData.decks || []);
        }

        // Fetch all cards
        const cardsResponse = await fetch('/cards');
        if (cardsResponse.ok) {
          const cardsData = await cardsResponse.json();
          setAllCards(cardsData.cards || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Delete a deck
  const deleteDeck = async (deckId: string) => {
    if (!window.confirm('Are you sure you want to delete this deck?')) {
      return;
    }

    try {
      const response = await fetch(`/decks/${deckId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedDecks(savedDecks.filter(deck => deck._id !== deckId));
        if (selectedDeck?._id === deckId) {
          setSelectedDeck(null);
        }
        setErrorModal({
          isOpen: true,
          title: 'Success!',
          message: 'Deck deleted successfully!',
          type: 'success'
        });
      } else {
        setErrorModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to delete deck',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      setErrorModal({
        isOpen: true,
        title: 'Network Error',
        message: 'Failed to delete deck. Please check your connection.',
        type: 'error'
      });
    }
  };

  const closeErrorModal = () => {
    setErrorModal(prev => ({ ...prev, isOpen: false }));
  };

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
                <div className="text-4xl mb-2">📚</div>
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
                    <p className="text-xs opacity-70">{deck.card_ids.length} cards</p>
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
                    🗑️
                  </button>
                </div>

                {/* Deck Statistics */}
                <div className="stats stats-horizontal shadow">
                  <div className="stat">
                    <div className="stat-title">Total Cards</div>
                    <div className="stat-value">{selectedDeck.card_ids.length}</div>
                    <div className="stat-desc">/ 40 maximum</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Total Cost</div>
                    <div className="stat-value">{selectedDeck.total_cost}</div>
                    <div className="stat-desc">Average: {selectedDeck.average_cost}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Colors</div>
                    <div className="stat-value">{selectedDeck.deck_colors.length}</div>
                    <div className="stat-desc">{selectedDeck.deck_colors.join(', ') || 'None'}</div>
                  </div>
                </div>
              </div>

              {/* Deck Cards */}
              <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Deck Cards</h3>
                
                {(() => {
                  const deckCardsWithCount = getDeckCardsWithCount(selectedDeck);
                  return deckCardsWithCount.length === 0 ? (
                    <div className="text-center py-8 text-base-content/70">
                      <div className="text-4xl mb-2">🃏</div>
                      <p>No cards in this deck</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {deckCardsWithCount.map(({ card, count }) => (
                        <div key={card.card_id} className="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
                          <img
                            src={`/image/${card.set_name}/${card.image_path}`}
                            alt={card.name}
                            className="w-16 h-20 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/64x80?text=Card';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{card.name}</h4>
                            <p className="text-xs text-base-content/70">{card.card_type}</p>
                            <p className="text-xs text-base-content/50">Cost: {card.cost}</p>
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
              <div className="text-6xl mb-4">👆</div>
              <h3 className="text-xl font-semibold mb-2">Select a Deck</h3>
              <p className="text-base-content/70">Choose a deck from the list to view its details</p>
            </div>
          )}
        </div>
      </div>

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

export default DeckViewer;
