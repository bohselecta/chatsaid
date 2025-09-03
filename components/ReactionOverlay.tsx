'use client';

import { useState } from 'react';
import ReactionButton, { ReactionType } from './ReactionButton';

interface ReactionOverlayProps {
  cherryId: string;
  reactions: Record<ReactionType, number>;
  userReactions: ReactionType[];
  onReact: (type: ReactionType) => void;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function ReactionOverlay({
  cherryId,
  reactions,
  userReactions,
  onReact,
  size = 'md',
  position = 'bottom'
}: ReactionOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleReact = (type: ReactionType) => {
    onReact(type);
  };

  const getPositionClasses = (pos: string) => {
    switch (pos) {
      case 'top':
        return 'bottom-full mb-2 left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'top-full mt-2 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 transform -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 transform -translate-y-1/2';
      default:
        return 'top-full mt-2 left-1/2 transform -translate-x-1/2';
    }
  };

  const reactionTypes: ReactionType[] = ['heart', 'laugh', 'zap', 'star'];

  return (
    <div 
      className="absolute z-10"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Reaction Buttons */}
      {isVisible && (
        <div className={`
          absolute ${getPositionClasses(position)}
          flex items-center gap-2 p-2
          bg-gray-800/90 backdrop-blur-sm rounded-full
          border border-gray-600 shadow-lg
          transition-all duration-200 ease-out
        `}>
          {reactionTypes.map((type) => (
            <ReactionButton
              key={type}
              type={type}
              count={reactions[type] || 0}
              isActive={userReactions.includes(type)}
              onReact={handleReact}
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
