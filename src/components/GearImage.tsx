interface GearImageProps {
  imageUrl?: string | null;
  itemType: 'rod' | 'lure';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const RARITY_COLORS = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#eab308',
};

const GearImage = ({ imageUrl, itemType, rarity, size = 'md', className = '' }: GearImageProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  // If we have a real image, show it
  if (imageUrl) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <img 
          src={imageUrl} 
          alt={`${rarity} ${itemType}`}
          className="w-full h-full object-contain"
          style={{
            filter: `drop-shadow(0 0 8px ${RARITY_COLORS[rarity]}40)`
          }}
        />
      </div>
    );
  }

  // Fallback: Show placeholder with rarity color
  return (
    <div 
      className={`${sizeClasses[size]} ${className} flex items-center justify-center rounded-2xl`}
      style={{
        background: `linear-gradient(135deg, ${RARITY_COLORS[rarity]}20, ${RARITY_COLORS[rarity]}05)`,
        border: `2px solid ${RARITY_COLORS[rarity]}40`,
        boxShadow: `0 0 20px ${RARITY_COLORS[rarity]}20`
      }}
    >
      {/* Placeholder icon */}
      <div className="text-4xl opacity-50">
        {itemType === 'rod' ? '🎣' : '🪝'}
      </div>
    </div>
  );
};

export default GearImage;
