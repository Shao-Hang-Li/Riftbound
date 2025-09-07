import React from 'react';
import { Card } from '../types';

interface CostDistributionChartProps {
  cards: Card[];
  showVertical?: boolean;
}

const CostDistributionChart: React.FC<CostDistributionChartProps> = ({ 
  cards, 
  showVertical = false 
}) => {
  // Early return if no cards
  if (!cards || cards.length === 0) {
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-4 text-center">Cost Distribution</h3>
        <div className="text-center text-gray-500">No cards to display</div>
      </div>
    );
  }

  // Calculate cost distribution
  const costDistribution = cards.reduce((acc, card) => {
    // Handle null/undefined costs by defaulting to 0
    const cost = card?.cost ?? 0;
    const costKey = cost >= 7 ? '7+' : cost.toString();
    
    if (!acc[costKey]) {
      acc[costKey] = 0;
    }
    acc[costKey]++;
    
    return acc;
  }, {} as Record<string, number>);

  // Get all cost levels (0-6, 7+)
  const costLevels = ['0', '1', '2', '3', '4', '5', '6', '7+'];
  const distributionValues = Object.values(costDistribution);
  const maxCount = distributionValues.length > 0 ? Math.max(...distributionValues) : 1;

  // Color scheme for different cost ranges
  const getBarColor = (cost: string) => {
    const costNum = cost === '7+' ? 7 : parseInt(cost);
    if (costNum <= 2) return 'bg-blue-600'; // Low cost - blue
    if (costNum <= 4) return 'bg-purple-600'; // Mid cost - purple
    return 'bg-gray-600'; // High cost - gray
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-center">Cost Distribution</h3>
      <div className={`flex ${showVertical ? 'flex-col space-y-2' : 'items-end space-x-1'} h-48`}>
        {costLevels.map((cost) => {
          const count = costDistribution[cost] || 0;
          const height = (count / maxCount) * 100;
          
          return (
            <div 
              key={cost} 
              className={`flex flex-col items-center ${showVertical ? 'w-full' : 'flex-1'}`}
            >
              <div className="text-sm font-medium mb-1">{count}</div>
              <div 
                className={`w-full ${getBarColor(cost)} rounded-t transition-all duration-300 hover:opacity-80`}
                style={{ 
                  height: `${Math.max(height, 2)}%`,
                  minHeight: count > 0 ? '8px' : '0px'
                }}
                title={`${count} cards at cost ${cost}`}
              />
              <div className="text-xs text-gray-500 mt-1">{cost}</div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-4 mt-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span>Low Cost (0-2)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-purple-600 rounded"></div>
          <span>Mid Cost (3-4)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-600 rounded"></div>
          <span>High Cost (5+)</span>
        </div>
      </div>
    </div>
  );
};

export default CostDistributionChart;
