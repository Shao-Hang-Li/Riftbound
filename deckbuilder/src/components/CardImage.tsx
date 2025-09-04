import React from 'react';
import { Card } from '../types';

interface CardImageProps {
  card: Card;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'preview' | 'gallery';
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  title?: string;
}

const CardImage: React.FC<CardImageProps> = ({
  card,
  className = '',
  size = 'medium',
  onError,
  onClick,
  onMouseEnter,
  onMouseLeave,
  title
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-10 h-12';
      case 'medium':
        return 'w-12 h-16';
      case 'large':
        return 'w-16 h-20';
      case 'preview':
        return 'w-64 h-auto';
      case 'gallery':
        return 'w-full h-auto';
      default:
        return 'w-12 h-16';
    }
  };

  const getImagePath = () => {
    // Use different paths based on context
    if (size === 'preview' || size === 'gallery') {
      return `/cards/${card.set_name}/${card.image_path}`;
    }
    return `/image/${card.set_name}/${card.image_path}`;
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    const placeholderSizes = {
      small: '40x48',
      medium: '48x64',
      large: '64x80',
      preview: '300x400',
      gallery: '300x400'
    };
    target.src = `https://via.placeholder.com/${placeholderSizes[size]}?text=Card`;
    onError?.(e);
  };

  return (
    <img
      src={getImagePath()}
      alt={card.name}
      className={`${getSizeClasses()} ${className} object-cover rounded`}
      onError={handleError}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={title}
    />
  );
};

export default CardImage;
