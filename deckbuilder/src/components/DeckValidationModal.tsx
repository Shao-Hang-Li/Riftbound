import React from 'react';

interface DeckValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  regularCards: number;
  battlefieldCards: number;
  legendCards: number;
  runeCards: number;
}

const DeckValidationModal: React.FC<DeckValidationModalProps> = ({
  isOpen,
  onClose,
  regularCards,
  battlefieldCards,
  legendCards,
  runeCards
}) => {
  if (!isOpen) return null;

  const requirements = [
    {
      name: 'Regular Cards',
      required: 40,
      current: regularCards,
      met: regularCards === 40
    },
    {
      name: 'Battlefield Cards',
      required: 3,
      current: battlefieldCards,
      met: battlefieldCards === 3
    },
    {
      name: 'Legend Card',
      required: 1,
      current: legendCards,
      met: legendCards === 1
    },
    {
      name: 'Rune Cards',
      required: 12,
      current: runeCards,
      met: runeCards === 12
    }
  ];


  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="mb-4">
          <h3 className="font-bold text-lg">Deck Requirements Not Met</h3>
        </div>
        
        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Your deck must meet the following requirements before it can be saved:
          </p>
          
          {requirements.map((req) => (
            <div key={req.name} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <span className={`text-lg ${req.met ? 'text-green-500' : 'text-red-500'}`}>
                  {req.met ? '\u2713' : '\u2715'}
                </span>
                <span className="font-medium">{req.name}</span>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${req.met ? 'text-green-600' : 'text-red-600'}`}>
                  {req.current} / {req.required}
                </div>
                {!req.met && (
                  <div className="text-xs text-red-500">
                    Need {req.required - req.current} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-action">
          <button className="btn btn-primary" onClick={onClose}>
            I Understand
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default DeckValidationModal;
