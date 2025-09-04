import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Card, CardColor } from '../types';
import { cardsService } from '../services/cardsService';

interface CardsContextType {
  cards: Card[];
  loading: boolean;
  error: string | null;
  filteredCards: Card[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedSet: string;
  setSelectedSet: (set: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedRarity: string;
  setSelectedRarity: (rarity: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedCost: string;
  setSelectedCost: (cost: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}

const CardsContext = createContext<CardsContextType | undefined>(undefined);

interface CardsProviderProps {
  children: ReactNode;
}

export const CardsProvider: React.FC<CardsProviderProps> = ({ children }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSet, setSelectedSet] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedCost, setSelectedCost] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Fetch cards on mount
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedCards = await cardsService.getCards();
        setCards(fetchedCards);
        setFilteredCards(fetchedCards);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cards');
        console.error('Error fetching cards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [cards, searchTerm, selectedSet, selectedType, selectedRarity, selectedColor, selectedCost, sortBy, sortOrder]);

  const applyFilters = () => {
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
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSet('all');
    setSelectedType('all');
    setSelectedRarity('all');
    setSelectedColor('all');
    setSelectedCost('all');
    setSortBy('name');
    setSortOrder('asc');
    setShowAdvancedFilters(false);
  };

  const value: CardsContextType = {
    cards,
    loading,
    error,
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
    setShowAdvancedFilters,
    applyFilters,
    resetFilters
  };

  return (
    <CardsContext.Provider value={value}>
      {children}
    </CardsContext.Provider>
  );
};

export const useCards = () => {
  const context = useContext(CardsContext);
  if (context === undefined) {
    throw new Error('useCards must be used within a CardsProvider');
  }
  return context;
};
