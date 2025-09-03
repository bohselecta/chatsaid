'use client';

import { useState } from 'react';
import Image from 'next/image';
import CherryNode from './CherryNode';

interface BranchProps {
  branch: {
    id: string;
    name: string;
    slug: string;
    description: string;
    color: string;
    icon: string;
    is_primary: boolean;
  };
  cherries: Array<{
    id: string;
    title?: string;
    content: string;
    image_url?: string;
    source_file?: string;
    line_number?: number;
    created_at: string;
    tags?: string[];
    review_status: string;
  }>;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function Branch({ branch, cherries, isExpanded = true, onToggle }: BranchProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getBranchColor = (color: string) => {
    return color.startsWith('#') ? color : `#${color}`;
  };

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* Branch Header */}
      <div className="sticky top-0 z-10 w-full bg-gray-800/95 backdrop-blur-sm border-b border-gray-600 py-4">
        <div className="flex items-center justify-center gap-3">
          {/* Branch Icon */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <Image
              src={`/${branch.icon}.png`}
              alt={branch.name}
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>
          
          {/* Branch Name */}
          <h2 
            className="text-xl font-bold text-white"
            style={{ color: getBranchColor(branch.color) }}
          >
            {branch.name}
          </h2>
          
          {/* Toggle Button */}
          {onToggle && (
            <button
              onClick={handleToggle}
              className="ml-2 p-1 hover:bg-gray-700 rounded transition-colors"
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${branch.name}`}
            >
              <span className="text-gray-400 text-lg">
                {isExpanded ? '−' : '+'}
              </span>
            </button>
          )}
        </div>
        
        {/* Branch Description */}
        <p className="text-center text-gray-400 text-sm mt-2 max-w-md mx-auto">
          {branch.description}
        </p>
      </div>

      {/* Cherries Container */}
      {isExpanded && (
        <div className="w-full max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cherries.map((cherry) => (
              <div key={cherry.id} className="flex justify-center">
                <CherryNode
                  cherry={cherry}
                  branch={branch}
                  size="md"
                />
              </div>
            ))}
          </div>
          
          {/* Empty State */}
          {cherries.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
                <span className="text-gray-500 text-4xl">🍒</span>
              </div>
              <p className="text-gray-400 text-lg">No cherries in this branch yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Upload some content to see cherries appear here
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
