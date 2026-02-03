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
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-36 h-36',
    xl: 'w-48 h-48',
  };

  // If we have a real image, show it
  if (imageUrl) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center`}>
        <img 
          src={imageUrl} 
          alt={`${rarity} ${itemType}`}
          className="w-full h-full object-contain"
          style={{
            filter: `drop-shadow(0 0 12px ${RARITY_COLORS[rarity]}60)`
          }}
          onError={(e) => {
            console.error('Image failed to load:', imageUrl);
            e.currentTarget.style.display = 'none';
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
      <div className="text-5xl opacity-50">
        {itemType === 'rod' ? '🎣' : '🪝'}
      </div>
    </div>
  );
};

export default GearImage;
