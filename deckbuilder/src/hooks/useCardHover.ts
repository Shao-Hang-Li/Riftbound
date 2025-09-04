import { useState, useCallback } from 'react';
import { Card } from '../types';

export const useCardHover = (delay: number = 1500) => {
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleCardHover = useCallback((card: Card) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    const timeout = setTimeout(() => {
      setHoveredCard(card);
    }, delay);
    
    setHoverTimeout(timeout);
  }, [hoverTimeout, delay]);

  const handleCardLeave = useCallback(() => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setHoveredCard(null);
  }, [hoverTimeout]);

  return {
    hoveredCard,
    handleCardHover,
    handleCardLeave
  };
};
