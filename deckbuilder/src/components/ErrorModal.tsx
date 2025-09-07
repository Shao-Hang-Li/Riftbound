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
    switch (type) {
      case 'success':
        return 'modal-box bg-success text-success-content';
      case 'warning':
        return 'modal-box bg-warning text-warning-content';
      case 'info':
        return 'modal-box bg-info text-info-content';
      default:
        return 'modal-box bg-error text-error-content';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '\u2713'; 
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
      <div className={getModalStyle()}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{getIcon()}</span>
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
        <p className="py-4">{message}</p>
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
