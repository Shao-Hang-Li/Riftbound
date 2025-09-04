import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Card, Deck, CardType } from '../types';

interface SpecialCards {
  battlefield: Card[];
  rune: Card[];
  legend: Card | null;
}

interface DeckContextType {
  deck: Deck;
  specialCards: SpecialCards;
  deckName: string;
  setDeckName: (name: string) => void;
  deckDescription: string;
  setDeckDescription: (description: string) => void;
  addCardToDeck: (card: Card) => Promise<void>;
  removeCardFromDeck: (cardId: string) => void;
  removeSpecialCard: (cardType: 'battlefield' | 'rune' | 'legend', cardId: string) => void;
  changeCardQuantity: (cardId: string, newQuantity: number) => void;
  changeRuneQuantity: (cardId: string, newQuantity: number) => void;
  removeAllRuneCopies: (cardId: string) => void;
  saveDeck: () => Promise<void>;
  resetDeck: () => void;
  getCardCount: (card: Card) => number;
  isCardDisabled: (card: Card) => boolean;
  getDeckCardsWithCount: () => { card: Card; count: number }[];
  calculateDeckStats: (cardIds: string[]) => Partial<Deck>;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

interface DeckProviderProps {
  children: ReactNode;
  cards: Card[];
  onError: (title: string, message: string, type: 'error' | 'warning' | 'success' | 'info') => void;
}

export const DeckProvider: React.FC<DeckProviderProps> = ({ children, cards, onError }) => {
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

  const [specialCards, setSpecialCards] = useState<SpecialCards>({
    battlefield: [],
    rune: [],
    legend: null
  });

  const [deckName, setDeckName] = useState('My New Deck');
  const [deckDescription, setDeckDescription] = useState('');

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

  // Add card to deck
  const addCardToDeck = async (card: Card) => {
    // Handle special card types separately
    if (card.card_type === 'Battlefield') {
      if (specialCards.battlefield.length >= 3) {
        onError('Battlefield Limit Reached', 'You must have exactly 3 Battlefield cards.', 'warning');
        return;
      }
      
      // Check if this card is already in battlefield
      if (specialCards.battlefield.some(c => c.card_id === card.card_id)) {
        onError('Card Already Added', 'This Battlefield card is already in your deck.', 'warning');
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
        onError('Rune Limit Reached', 'You can have up to 12 Rune cards total.', 'warning');
        return;
      }
      
      // Add rune card (unlimited copies allowed, just total limit of 12)
      setSpecialCards(prev => ({
        ...prev,
        rune: [...prev.rune, card]
      }));
      return;
    }

    if (card.card_type === 'Legend') {
      if (specialCards.legend) {
        onError('Legend Limit Reached', 'You must have exactly 1 Legend card.', 'warning');
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
      onError('Deck Full', 'Deck is full! Maximum 40 cards allowed.', 'warning');
      return;
    }

    const currentCount = deck.card_ids.filter(id => id === card.card_id).length;
    if (currentCount >= 3) {
      onError('Maximum Copies Reached', `Cannot add more than 3 copies of ${card.name}`, 'warning');
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

  // Change rune quantity
  const changeRuneQuantity = (cardId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    const currentCount = specialCards.rune.filter(id => id.card_id === cardId).length;
    let newRunes = [...specialCards.rune];
    
    if (newQuantity > currentCount) {
      // Add more copies
      const card = cards.find(c => c.card_id === cardId);
      if (card && newRunes.length + (newQuantity - currentCount) <= 12) {
        const copiesToAdd = newQuantity - currentCount;
        for (let i = 0; i < copiesToAdd; i++) {
          newRunes.push(card);
        }
      }
    } else if (newQuantity < currentCount) {
      // Remove copies
      const copiesToRemove = currentCount - newQuantity;
      for (let i = 0; i < copiesToRemove; i++) {
        const index = newRunes.findIndex(rune => rune.card_id === cardId);
        if (index > -1) {
          newRunes.splice(index, 1);
        }
      }
    }
    
    setSpecialCards(prev => ({
      ...prev,
      rune: newRunes
    }));
  };

  // Remove all copies of a rune card
  const removeAllRuneCopies = (cardId: string) => {
    setSpecialCards(prev => ({
      ...prev,
      rune: prev.rune.filter(card => card.card_id !== cardId)
    }));
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
      onError('Missing Information', 'Please enter a deck name', 'warning');
      return;
    }

    // Validate special card requirements
    if (specialCards.battlefield.length !== 3) {
      onError('Invalid Deck', 'You must have exactly 3 Battlefield cards.', 'error');
      return;
    }

    if (!specialCards.legend) {
      onError('Invalid Deck', 'You must have exactly 1 Legend card.', 'error');
      return;
    }

    // Rune cards are required (exactly 12)
    if (specialCards.rune.length !== 12) {
      onError('Invalid Deck', 'You must have exactly 12 Rune cards.', 'error');
      return;
    }

    if (deck.card_ids.length === 0) {
      onError('Empty Deck', 'Please add some cards to your deck', 'warning');
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
        await response.json();
        onError('Success!', 'Deck saved successfully!', 'success');
        resetDeck();
      } else {
        const errorData = await response.json();
        onError('Error Saving Deck', `Error saving deck: ${errorData.detail || errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error saving deck:', error);
      onError('Network Error', 'Failed to save deck. Please check your connection.', 'error');
    }
  };

  // Reset deck
  const resetDeck = () => {
    const resetDeckData = {
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
    setDeck(resetDeckData);
    setSpecialCards({
      battlefield: [],
      rune: [],
      legend: null
    });
    setDeckName('My New Deck');
    setDeckDescription('');
  };

  // Get card count for display
  const getCardCount = (card: Card): number => {
    if (card.card_type === 'Rune') {
      return specialCards.rune.filter(c => c.card_id === card.card_id).length;
    } else if (card.card_type === 'Battlefield') {
      return specialCards.battlefield.filter(c => c.card_id === card.card_id).length;
    } else if (card.card_type === 'Legend') {
      return specialCards.legend?.card_id === card.card_id ? 1 : 0;
    } else {
      return deck.card_ids.filter(id => id === card.card_id).length;
    }
  };

  // Check if card is disabled
  const isCardDisabled = (card: Card): boolean => {
    if (card.card_type === 'Rune') {
      return specialCards.rune.length >= 12;
    } else if (card.card_type === 'Battlefield') {
      return specialCards.battlefield.length >= 3;
    } else if (card.card_type === 'Legend') {
      return specialCards.legend !== null;
    } else {
      const currentCount = deck.card_ids.filter(id => id === card.card_id).length;
      return currentCount >= 3 || deck.card_ids.length >= 40;
    }
  };

  // Get deck cards with full details and count
  const getDeckCardsWithCount = () => {
    return deck.card_ids.reduce((acc, cardId) => {
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
  };

  const value: DeckContextType = {
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
    resetDeck,
    getCardCount,
    isCardDisabled,
    getDeckCardsWithCount,
    calculateDeckStats
  };

  return (
    <DeckContext.Provider value={value}>
      {children}
    </DeckContext.Provider>
  );
};

export const useDeck = () => {
  const context = useContext(DeckContext);
  if (context === undefined) {
    throw new Error('useDeck must be used within a DeckProvider');
  }
  return context;
};