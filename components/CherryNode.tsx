'use client';

import { useState } from 'react';
import Image from 'next/image';
import CherryCard from './CherryCard';
import ReactionOverlay from './ReactionOverlay';
import { ReactionType } from './ReactionButton';

interface CherryNodeProps {
  cherry: {
    id: string;
    title?: string;
    content: string;
    image_url?: string;
    source_file?: string;
    line_number?: number;
    created_at: string;
    tags?: string[];
    review_status: string;
    reactions?: Record<ReactionType, number>;
    comment_count?: number;
  };
  branch: {
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

export default function CherryNode({ cherry, branch, size = 'md' }: CherryNodeProps) {
  const [isCardOpen, setIsCardOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16 text-xs',
    md: 'w-20 h-20 text-sm',
    lg: 'w-24 h-24 text-base'
  };

  const getBranchColor = (color: string) => {
    return color.startsWith('#') ? color : `#${color}`;
  };

  const handleClick = () => {
    setIsCardOpen(true);
  };

  const handleClose = () => {
    setIsCardOpen(false);
  };

  // Truncate content for display
  const truncatedContent = cherry.content.length > 100 
    ? cherry.content.substring(0, 100) + '...'
    : cherry.content;

  return (
    <>
      {/* Cherry Node */}
      <div
        onClick={handleClick}
        className={`
          ${sizeClasses[size]} 
          rounded-full border-2 cursor-pointer transition-all duration-200
          hover:scale-110 hover:shadow-lg hover:shadow-black/20
          flex items-center justify-center text-center p-2
          bg-gray-800 border-gray-600 hover:border-gray-500
        `}
        style={{
          borderColor: getBranchColor(branch.color),
          boxShadow: `0 0 10px ${getBranchColor(branch.color)}20`
        }}
        title={`${cherry.title || 'Cherry'}: ${truncatedContent}`}
      >
        {/* Content inside the node */}
        <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
          {/* Image if exists */}
          {cherry.image_url ? (
            <Image
              src={cherry.image_url}
              alt="Cherry content"
              width={size === 'sm' ? 48 : size === 'md' ? 64 : 80}
              height={size === 'sm' ? 48 : size === 'md' ? 64 : 80}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            /* Text content */
            <div className="text-gray-200 leading-tight">
              {truncatedContent}
            </div>
          )}
        </div>

        {/* Branch indicator dot */}
        <div
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800"
          style={{ backgroundColor: getBranchColor(branch.color) }}
        />
        
        {/* Reaction Overlay */}
        <ReactionOverlay
          cherryId={cherry.id}
          reactions={cherry.reactions || { heart: 0, laugh: 0, zap: 0, star: 0 }}
          userReactions={[]} // TODO: Get from user context
          onReact={(type) => {
            // TODO: Handle reaction in parent component
            console.log('Reaction:', type, 'on cherry:', cherry.id);
          }}
          size={size}
          position="bottom"
        />
      </div>

      {/* Cherry Card Overlay */}
      <CherryCard
        cherry={cherry}
        branch={branch}
        isOpen={isCardOpen}
        onClose={handleClose}
      />
    </>
  );
}
