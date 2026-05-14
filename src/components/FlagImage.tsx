import React from 'react';
import { getFlagUrlByCountry } from '../constants/flagImages';

interface FlagImageProps {
  country: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: '20px',
  md: '32px',
  lg: '48px',
};

export const FlagImage: React.FC<FlagImageProps> = ({ country, size = 'md', className = '' }) => {
  const flagUrl = getFlagUrlByCountry(country);
  
  if (!flagUrl) {
    return <span className={className}>🏳️</span>;
  }

  return (
    <img
      src={flagUrl}
      alt={`${country} flag`}
      style={{
        height: sizeMap[size],
        width: sizeMap[size],
        marginRight: '8px',
        borderRadius: '50%',
      }}
      className={className}
      onError={(e) => {
        // Fallback if image fails to load
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};
