import React from 'react';
import { Deck } from '../types';

interface DeckStatsProps {
  deck: Deck;
  showVertical?: boolean;
  showColors?: boolean;
  showCost?: boolean;
}

const DeckStats: React.FC<DeckStatsProps> = ({
  deck,
  showVertical = false,
  showColors = true,
  showCost = true
}) => {
  const statsClass = showVertical ? 'stats stats-vertical shadow' : 'stats stats-horizontal shadow';

  return (
    <div className={statsClass}>
      <div className="stat">
        <div className="stat-title">Regular Cards</div>
        <div className="stat-value">{deck.card_ids.length}</div>
        <div className="stat-desc">/ 40 required</div>
      </div>
      
      {showCost && (
        <div className="stat">
          <div className="stat-title">Average Cost</div>
          <div className="stat-value">{deck.average_cost}</div>
          <div className="stat-desc">per card</div>
        </div>
      )}
      
      {showColors && (
        <div className="stat">
          <div className="stat-title">Colors</div>
          <div className="stat-value">{deck.deck_colors.length}</div>
          <div className="stat-desc">{deck.deck_colors.join(', ') || 'None'}</div>
        </div>
      )}
    </div>
  );
};

export default DeckStats;
