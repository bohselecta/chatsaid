'use client';

import { useState } from 'react';
import { Heart, Laugh, Zap, Star } from 'lucide-react';

export type ReactionType = 'heart' | 'laugh' | 'zap' | 'star';

interface ReactionButtonProps {
  type: ReactionType;
  count: number;
  isActive: boolean;
  onReact: (type: ReactionType) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function ReactionButton({ 
  type, 
  count, 
  isActive, 
  onReact, 
  size = 'md' 
}: ReactionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getIcon = (type: ReactionType) => {
    switch (type) {
      case 'heart': return <Heart className="w-full h-full" />;
      case 'laugh': return <Laugh className="w-full h-full" />;
      case 'zap': return <Zap className="w-full h-full" />;
      case 'star': return <Star className="w-full h-full" />;
      default: return <Heart className="w-full h-full" />;
    }
  };

  const getColors = (type: ReactionType, isActive: boolean) => {
    if (isActive) {
      switch (type) {
        case 'heart': return 'text-red-500 bg-red-500/20 border-red-500/30';
        case 'laugh': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
        case 'zap': return 'text-blue-500 bg-blue-500/20 border-blue-500/30';
        case 'star': return 'text-purple-500 bg-purple-500/20 border-purple-500/30';
        default: return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
      }
    } else {
      return 'text-gray-400 bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm': return 'w-6 h-6 text-xs';
      case 'md': return 'w-8 h-8 text-sm';
      case 'lg': return 'w-10 h-10 text-base';
      default: return 'w-8 h-8 text-sm';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering cherry card
    onReact(type);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        ${getSizeClasses(size)}
        flex items-center justify-center gap-1
        rounded-full border transition-all duration-200
        hover:scale-110 hover:shadow-lg
        ${getColors(type, isActive)}
      `}
      title={`${type.charAt(0).toUpperCase() + type.slice(1)} (${count})`}
    >
      <div className={`${getSizeClasses(size)} flex items-center justify-center`}>
        {getIcon(type)}
      </div>
      {count > 0 && (
        <span className="text-xs font-medium min-w-[1rem] text-center">
          {count}
        </span>
      )}
    </button>
  );
}
