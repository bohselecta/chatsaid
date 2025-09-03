'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TreePine, Sparkles, Bot, Users } from 'lucide-react';

export default function CanopyNavigation() {
  const pathname = usePathname();

  const navigationItems = [
    {
      href: '/canopy',
      label: 'Classic Canopy',
      description: 'Original branch-based view',
      icon: TreePine,
      color: 'text-green-400'
    },
    {
      href: '/enhanced-canopy',
      label: 'Enhanced Canopy',
      description: 'Interactive visualization',
      icon: Sparkles,
      color: 'text-purple-400'
    },
    {
      href: '/enhanced-canopy-v2',
      label: 'Enhanced Canopy V2',
      description: 'UX-optimized with AI companions',
      icon: Bot,
      color: 'text-blue-400'
    },
    {
      href: '/enhanced-canopy-v3',
      label: 'Interactive Canopy',
      description: 'React, engage, and explore',
      icon: Users,
      color: 'text-red-400'
    }
  ];

  return (
    <div className="bg-gray-800 border-b border-gray-600">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-gray-400 text-sm font-medium">Canopy Views:</span>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          
          <div className="text-xs text-gray-500">
            <Users className="w-3 h-3 inline mr-1" />
            {navigationItems.length} views available
          </div>
        </div>
      </div>
    </div>
  );
}
