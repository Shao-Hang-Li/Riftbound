import React from 'react';
import { Card } from '../types';
import CardImage from './CardImage';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
}

const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose }) => {
  if (!card) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-base-100 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Card Image */}
          <div className="lg:w-1/2 p-4 flex justify-center items-center bg-base-100 rounded-lg">
            <div className="relative">
              <CardImage
                card={card}
                size="preview"
                className="rounded-lg shadow-xl object-contain max-h-[500px]"
              />
            </div>
          </div>

          {/* Right Side - Card Details */}
          <div className="lg:w-1/2 p-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-primary">{card.name}</h2>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Card Header Bar */}
            <div className="bg-primary text-primary-content p-2 rounded mb-4 text-center font-semibold">
              {card.card_id} {card.name}
            </div>

            {/* Compact Card Properties */}
            <div className="space-y-3">
              {/* Description First */}
              {card.description && (
                <div>
                  <label className="text-sm font-semibold text-base-content/70 block mb-1">Description</label>
                  <div className="bg-base-200 p-2 rounded text-sm min-h-[40px]">
                    {card.description}
                  </div>
                </div>
              )}

              {/* Basic Stats - Compact Grid */}
              <div className={`grid gap-3 ${card.might !== undefined && card.might !== null && card.might > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <label className="text-sm font-semibold text-base-content/70 block mb-1">Name</label>
                  <div className="bg-base-200 p-2 rounded text-sm font-medium">
                    {card.name}
                  </div>
                </div>

                {card.might !== undefined && card.might !== null && card.might > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-base-content/70 block mb-1">Might</label>
                    <div className="bg-base-200 p-2 rounded text-sm font-medium text-center">
                      {card.might}
                    </div>
                  </div>
                )}
              </div>

              {/* Cost and Card Type Row */}
              <div className="grid grid-cols-2 gap-3">
                {card.cost !== undefined && card.cost !== null && (
                  <div>
                    <label className="text-sm font-semibold text-base-content/70 block mb-1">Cost</label>
                    <div className="bg-base-200 p-2 rounded text-sm font-medium text-center">
                      {card.cost}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-base-content/70 block mb-1">Card type</label>
                  <div className="bg-base-200 p-2 rounded text-sm font-medium text-center">
                    {card.card_type}
                  </div>
                </div>
              </div>

              {/* Rarity */}
              <div>
                <label className="text-sm font-semibold text-base-content/70 block mb-1">Rarity</label>
                <div className={`badge badge-lg text-base-100 ${
                  card.rarity === 'Common' ? 'badge-ghost' :
                  card.rarity === 'Uncommon' ? 'badge-info' :
                  card.rarity === 'Rare' ? 'badge-primary' :
                  card.rarity === 'Epic' ? 'badge-secondary' :
                  'badge-accent'
                }`}>
                  {card.rarity}
                </div>
              </div>

              {/* Subtypes and Keywords on same line */}
              {(card.subtype && card.subtype.length > 0) || (card.keywords && card.keywords.length > 0) ? (
                <div className="grid grid-cols-2 gap-3">
                  {/* Subtypes */}
                  {card.subtype && card.subtype.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold text-base-content/70 block mb-1">Subtypes</label>
                      <div className="flex gap-2">
                        {card.subtype.map((subtype, index) => (
                          <div key={index} className="badge badge-outline badge-sm">
                            {subtype}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  {card.keywords && card.keywords.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold text-base-content/70 block mb-1">Keywords</label>
                      <div className="flex gap-2">
                        {card.keywords.map(keyword => (
                          <div key={keyword} className="badge badge-primary badge-sm">
                            {keyword}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Flavor Text */}
              {card.flavor_text && (
                <div>
                  <label className="text-sm font-semibold text-base-content/70 block mb-1">Flavor Text</label>
                  <div className="bg-base-200 p-2 rounded text-sm italic min-h-[40px]">
                    "{card.flavor_text}"
                  </div>
                </div>
              )}
            </div>

            {/* Footer Info */}
            <div className="pt-3 border-t border-base-300 mt-4">
              <div className="flex justify-between items-center text-sm text-base-content/70">
                <span>ID: {card.card_id}</span>
                {card.artist && <span>Artist: {card.artist}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;
