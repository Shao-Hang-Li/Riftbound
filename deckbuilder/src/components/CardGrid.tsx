import React from 'react';
import { Card } from '../types';
import CardImage from './CardImage';

interface CardGridProps {
  cards: Card[];
  onCardClick?: (card: Card) => void;
  onCardHover?: (card: Card) => void;
  onCardLeave?: () => void;
  getCardCount?: (card: Card) => number;
  isCardDisabled?: (card: Card) => boolean;
  gridCols?: string;
  cardSize?: 'small' | 'medium' | 'large' | 'preview';
  showCount?: boolean;
}

const CardGrid: React.FC<CardGridProps> = ({
  cards,
  onCardClick,
  onCardHover,
  onCardLeave,
  getCardCount,
  isCardDisabled,
  gridCols = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  cardSize = 'medium',
  showCount = false
}) => {
  return (
    <div className={`grid ${gridCols} gap-3`}>
      {cards.map((card) => {
        const currentCount = getCardCount?.(card) || 0;
        const isDisabled = isCardDisabled?.(card) || false;
        
        return (
          <div 
            key={card.card_id} 
            className={`card shadow-lg transition-shadow border-2 ${
              isDisabled 
                ? 'bg-base-300 opacity-50 cursor-not-allowed border-gray-400' 
                : 'bg-base-100 hover:shadow-xl cursor-pointer border-transparent hover:border-primary'
            }`}
            onClick={() => !isDisabled && onCardClick?.(card)}
            onMouseEnter={() => !isDisabled && onCardHover?.(card)}
            onMouseLeave={onCardLeave}
            title={isDisabled ? `${card.name} - Maximum copies reached (3)` : `Click to add ${card.name} to deck`}
          >
            <figure className="px-2 pt-2">
              <CardImage
                card={card}
                size={cardSize}
                className="rounded-lg w-full h-auto object-contain"
              />
            </figure>
            <div className="card-body p-2">
              <h3 className="card-title text-xs font-bold truncate">{card.name}</h3>
              <p className="text-xs text-base-content/70">{card.card_type}</p>
              <div className="card-actions justify-end mt-1">
                <div className="badge badge-primary badge-sm">{card.card_id}</div>
                {showCount && currentCount > 0 && (
                  <div className="badge badge-secondary badge-sm">x{currentCount}</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardGrid;
