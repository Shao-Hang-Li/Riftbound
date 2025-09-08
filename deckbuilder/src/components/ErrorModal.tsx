import React from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'success' | 'info';
}

const ErrorModal: React.FC<ErrorModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'error' 
}) => {
  if (!isOpen) return null;

  const getModalStyle = () => {
    return 'modal-box';
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return null; 
      case 'warning':
        return '\u26A0'; 
      case 'info':
        return '\u2139'; 
      default:
        return '\u2715'; 
    }
  };

  return (
    <div className="modal modal-open">
      <div className={`${getModalStyle()} flex flex-col justify-center`}>
        {title && (
          <div className="flex items-center gap-3 mb-4">
            {getIcon() && <span className="text-2xl">{getIcon()}</span>}
            <h3 className="font-bold text-lg">{title}</h3>
          </div>
        )}
        <p className="py-4 text-center text-xl font-medium">{message}</p>
        <div className="modal-action">
          <button className="btn btn-primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default ErrorModal;
