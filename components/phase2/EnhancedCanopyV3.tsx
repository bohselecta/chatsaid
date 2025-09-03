'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, Search, Grid, List, Bot, Users, Sparkles, Menu, X, Info } from 'lucide-react';
import useCanopyFeed from '../../lib/hooks/useCanopyFeed';
import { EmptyState, ErrorState, LoadingState } from '@/components/canopy/States';
import InteractiveCherryCard from './InteractiveCherryCard';
import CategoryRail from '@/components/nav/CategoryRail';
import GuidePanel from '@/components/bot/GuidePanel';
import { CATEGORIES } from '@/lib/nav/categories';

// Category dock items generated from shared metadata
const categoryDockItems = CATEGORIES.map(c => ({
  id: c.key,
  name: c.label,
  icon: c.iconPath.replace(/^\//, ''),
  color: 'transparent',
  colorName: '',
  hoverColor: 'rgba(255,255,255,0.08)',
  textColor: 'inherit'
}));

export default function EnhancedCanopyV3() {
  const [sortBy, setSortBy] = useState('mixed');
  const [contentFilter, setContentFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [followedBots, setFollowedBots] = useState<string[]>([]);
  const [userSavedCategories, setUserSavedCategories] = useState<Record<string, string[]>>({});
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dockInHeader, setDockInHeader] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [query, setQuery] = useState('');

  const headerRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useSearchParams();
  const simulateError = params?.get('simulateError') === '1';

  const { cherries, loading, error, hasMore, loadMore } = useCanopyFeed({
    sortBy,
    contentFilter
  });

  // Set dark theme by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Sync URL params -> state
  useEffect(() => {
    const cat = params?.get('cat') || null;
    const q = params?.get('q') || '';
    setSelectedCategory(cat);
    setQuery(q);
  }, [params]);

  // Check for collisions and adjust dock position
  useEffect(() => {
    const checkCollisions = () => {
      if (!headerRef.current || !dockRef.current || !searchRef.current || !userMenuRef.current) {
        return;
      }

      const headerRect = headerRef.current.getBoundingClientRect();
      const dockRect = dockRef.current.getBoundingClientRect();
      const searchRect = searchRef.current.getBoundingClientRect();
      const userMenuRect = userMenuRef.current.getBoundingClientRect();

      // Check if dock would overlap with search or user menu
      const dockRight = dockRect.right;
      const searchLeft = searchRect.left;
      const userMenuLeft = userMenuRect.left;

      // More conservative collision detection with better spacing
      const minSpacing = 30; // Increased from 20 to 30px
      
      // If dock would collide, move it to hamburger menu
      if (dockRight > searchLeft - minSpacing || dockRight > userMenuLeft - minSpacing) {
        setDockInHeader(false);
      } else {
        setDockInHeader(true);
      }
    };

    // Only check collisions if we're on a screen size where the dock should be visible
    const checkCollisionsIfNeeded = () => {
      if (window.innerWidth >= 1280) { // xl breakpoint
        checkCollisions();
      } else {
        setDockInHeader(false);
      }
    };

    checkCollisionsIfNeeded();
    window.addEventListener('resize', checkCollisionsIfNeeded);
    return () => window.removeEventListener('resize', checkCollisionsIfNeeded);
  }, []);

  const handleReaction = async (cherryId: string, reactionType: string) => {
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cherryId,
          userId: 'anonymous', // For demo purposes
          reactionType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }

      console.log(`Added ${reactionType} reaction to cherry ${cherryId}`);
    } catch (error) {
      console.error('Reaction error:', error);
    }
  };

  const handleSaveToCategory = async (cherryId: string, category: string) => {
    try {
      // For demo purposes, we'll just update local state
      // In a real app, this would call an API to save to the user's collection
      setUserSavedCategories(prev => {
        const currentCategories = prev[cherryId] || [];
        const isAlreadySaved = currentCategories.includes(category);
        
        if (isAlreadySaved) {
          // Remove from category
          return {
            ...prev,
            [cherryId]: currentCategories.filter(cat => cat !== category)
          };
        } else {
          // Add to category
          return {
            ...prev,
            [cherryId]: [...currentCategories, category]
          };
        }
      });

      console.log(`Saved cherry ${cherryId} to category ${category}`);
    } catch (error) {
      console.error('Save to category error:', error);
    }
  };

  const handleFollowBot = (botName: string) => {
    setFollowedBots(prev => 
      prev.includes(botName) 
        ? prev.filter(name => name !== botName)
        : [...prev, botName]
    );
    console.log(`Toggled follow for bot: ${botName}`);
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    const next = new URLSearchParams(params?.toString() || '');
    if (categoryId) next.set('cat', categoryId); else next.delete('cat');
    router.replace(`/canopy?${next.toString()}`, { scroll: false });
  };

  const handleCardCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    console.log(`Filtering by card category: ${categoryId}`);
  };



  // Filter cherries based on selected category
  const getFilteredCherries = () => {
    let filtered = cherries.filter(cherry => {
      if (contentFilter === 'ai-only') {
        return cherry.bot_attribution || cherry.simulated_activity;
      }
      if (contentFilter === 'human-only') {
        return !cherry.bot_attribution && !cherry.simulated_activity;
      }
      return true;
    });

    // Apply category filter if selected
    if (selectedCategory) {
      filtered = filtered.filter(cherry => {
        const tags = cherry.tags || [];
        
        // Map category IDs to tag patterns
        const categoryTagMap: Record<string, string[]> = {
          'funny': ['humor', 'funny', 'comedy'],
          'weird': ['philosophy', 'metaphysical', 'spiritual', 'mystical', 'weird'],
          'technical': ['coding', 'tech', 'programming'],
          'research': ['research', 'academic', 'study'],
          'ideas': ['creativity', 'ideas', 'inspiration']
        };
        
        const categoryTags = categoryTagMap[selectedCategory] || [];
        return categoryTags.some(tag => tags.includes(tag));
      });
    }

    // Apply text query filter
    if (query.trim()) {
      const ql = query.trim().toLowerCase();
      filtered = filtered.filter(cherry => {
        const text = `${cherry.title || ''} ${cherry.content || ''}`.toLowerCase();
        const tags = (cherry.tags || []).join(' ').toLowerCase();
        return text.includes(ql) || tags.includes(ql);
      });
    }

    return filtered;
  };

  const filteredCherries = getFilteredCherries();
  const seedCountsEnabled = process.env.NODE_ENV !== 'production' && params?.get('seedCounts') === '1';
  const enableBatch = (process.env.NEXT_PUBLIC_ENABLE_REACT_BATCH === '1') || (params?.get('enableBatch') === '1');
  const viewCherries = seedCountsEnabled
    ? filteredCherries.map((c) => ({
        ...c,
        reactionCounts: c.reactionCounts || { funny: 1, ideas: 2 },
      }))
    : filteredCherries;

  // Analytics: track empty state views keyed by q+cat
  useEffect(() => {
    try {
      if (!loading && filteredCherries.length === 0) {
        const { track } = require('@/lib/analytics/events');
        track('canopy_empty_state_view', { q: query || undefined, cat: selectedCategory || undefined });
      }
    } catch {}
  }, [loading, filteredCherries.length, query, selectedCategory]);

  if (simulateError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto"><ErrorState /></div>
      </div>
    );
  }

  if (loading && cherries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto"><LoadingState /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto"><ErrorState /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#12151b] dark:to-[#0f1419]">
             {/* Single Header with All Controls */}
                   <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm" ref={headerRef}>
         <div className="max-w-7xl mx-auto px-4 py-4">
           {/* Main Header Row */}
           <div className="flex items-center justify-between min-w-0 mb-3">
             {/* Left side: Title and Category Dock */}
             <div className="flex items-center space-x-4 lg:space-x-6 min-w-0 flex-1">
               <h1 className="text-xl lg:text-2xl font-bold flex items-center text-gray-900 dark:text-gray-100 flex-shrink-0">
                 <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 mr-2 text-red-500" />
                 <span className="whitespace-nowrap">Canopy</span>
               </h1>
               
                {/* Category Dock - shown in header when space allows */}
                {dockInHeader && (
                  <nav aria-label="Canopy categories" ref={dockRef} className="hidden xl:flex items-center space-x-2 min-w-0">
                    <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 font-medium mr-1 lg:mr-2 whitespace-nowrap">Categories:</span>
                    <CategoryRail variant="chip" navigate={false} onSelect={(key) => handleCategoryFilter(selectedCategory === key ? null : key)} />
                  </nav>
                )}
             </div>
             
             {/* Center: Stats - hidden on smaller screens to prevent crowding */}
             <div className="hidden lg:block text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
               <span className="whitespace-nowrap">
                 {filteredCherries.length} cherries • {followedBots.length} bots followed
                 {selectedCategory && (
                   <span className="ml-2 text-blue-600 dark:text-blue-400">
                     • {categoryDockItems.find(item => item.id === selectedCategory)?.name}
                   </span>
                 )}
               </span>
             </div>
             
             {/* Right side: Search, User Menu, and Mobile Menu */}
             <div className="flex items-center space-x-2 lg:space-x-4 min-w-0 flex-shrink-0">
                                     {/* Search Bar */}
                      <div ref={searchRef} className="hidden md:flex items-center space-x-2">
                        <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <input
                          type="search"
                          aria-label="Search posts"
                          value={query}
                          onChange={(e) => setQuery(e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const next = new URLSearchParams(params?.toString() || '');
                              if (query.trim()) next.set('q', query.trim()); else next.delete('q');
                              router.replace(`/canopy?${next.toString()}`, { scroll: false });
                            }
                          }}
                          placeholder="Discover cherries..."
                          className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 lg:px-4 py-2 text-sm w-40 lg:w-64 focus:ring-2 focus:ring-cherry-500 focus:border-cherry-500 dark:text-gray-100 dark:placeholder-gray-400 transition-all duration-200"
                        />
                      </div>
               
                                     {/* Help Button */}
                      <button
                        onClick={() => setShowHelpModal(true)}
                        className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Help & Information"
                        aria-label="Open help modal"
                      >
                        <Info className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                      
                      {/* User Menu (simplified for demo) */}
                      <div ref={userMenuRef} className="hidden md:flex items-center">
                        <button className="text-sm text-gray-700 dark:text-gray-300 hover:text-cherry-600 dark:hover:text-cherry-400 transition-colors whitespace-nowrap">
                          Log in
                        </button>
                      </div>
               
               {/* Mobile Menu Button */}
               <button
                 onClick={() => setShowMobileMenu(!showMobileMenu)}
                 className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                 aria-label="Toggle mobile menu"
               >
                 {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
               </button>
               
                                     {/* View Mode Toggle */}
                      <div className="flex items-center space-x-1 lg:space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 shadow-sm">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-1.5 lg:p-2 rounded transition-all duration-200 ${
                            viewMode === 'grid' 
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-cherry-600 dark:text-cherry-400' 
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                          title="Grid view"
                          aria-label="Switch to grid view"
                        >
                          <Grid className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-1.5 lg:p-2 rounded transition-all duration-200 ${
                            viewMode === 'list' 
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-cherry-600 dark:text-cherry-400' 
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                          title="List view"
                          aria-label="Switch to list view"
                        >
                          <List className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                      </div>
             </div>
           </div>

           {/* Controls Row */}
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-4">
               {/* Sort Options */}
               <div className="flex items-center space-x-2">
                 <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                 <label htmlFor="sort-select" className="sr-only">Sort by</label>
                 <select
                   id="sort-select"
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value)}
                   className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100"
                   aria-label="Sort cherries by"
                 >
                   <option value="mixed">Mixed</option>
                   <option value="newest">Newest</option>
                   <option value="popular">Popular</option>
                   <option value="bot-focus">Bot Focus</option>
                 </select>
               </div>

               {/* Content Filter */}
               <div className="flex items-center space-x-2">
                 <Bot className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                 <label htmlFor="content-filter" className="sr-only">Filter content</label>
                 <select
                   id="content-filter"
                   value={contentFilter}
                   onChange={(e) => setContentFilter(e.target.value)}
                   className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100"
                   aria-label="Filter content by type"
                 >
                   <option value="all">All Content</option>
                   <option value="ai-only">AI Only</option>
                   <option value="human-only">Human Only</option>
                 </select>
               </div>

               {/* Category Filter Clear Button */}
               {selectedCategory && (
                 <div className="flex items-center space-x-2">
                   <button
                     onClick={() => handleCategoryFilter(null)}
                     className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1"
                   >
                     <X className="w-3 h-3" />
                     <span>Clear {categoryDockItems.find(item => item.id === selectedCategory)?.name} filter</span>
                   </button>
                 </div>
               )}
             </div>
           </div>
           
                       {/* Mobile Menu */}
            {showMobileMenu && (
              <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-900 dark:from-blue-900 to-purple-900 dark:to-purple-900">
               {/* Mobile Search */}
               <div className="flex items-center space-x-2 mb-4">
                 <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                 <input
                   type="text"
                   placeholder="Search cherries..."
                   className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
                 />
               </div>
               
               {/* Mobile Category Dock */}
               <div className="mb-4">
                 <span className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2 block">Categories:</span>
                 <div className="grid grid-cols-2 gap-2">
                   {categoryDockItems.map((item) => (
                     <button
                       key={item.id}
                       onClick={() => handleCategoryFilter(selectedCategory === item.id ? null : item.id)}
                       className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 shadow-sm ${
                         selectedCategory === item.id 
                           ? 'shadow-md ring-2 ring-offset-2 ring-offset-gray-900 dark:ring-offset-gray-100' 
                           : 'hover:shadow-md hover:scale-105'
                       }`}
                       style={{
                         backgroundColor: selectedCategory === item.id ? item.color : 'transparent',
                         color: selectedCategory === item.id ? item.textColor : 'inherit',
                         borderColor: selectedCategory === item.id ? item.color : 'transparent',
                         '--hover-bg': item.hoverColor
                       } as React.CSSProperties}
                       onMouseEnter={(e) => {
                         if (selectedCategory !== item.id) {
                           e.currentTarget.style.backgroundColor = item.hoverColor;
                           e.currentTarget.style.color = item.textColor;
                         }
                       }}
                       onMouseLeave={(e) => {
                         if (selectedCategory !== item.id) {
                           e.currentTarget.style.backgroundColor = 'transparent';
                           e.currentTarget.style.color = 'inherit';
                         }
                       }}
                       title={`${item.name} - ${item.colorName}`}
                     >
                       <img 
                         src={`/${item.icon}`}
                         alt={`${item.name} icon`}
                         className="w-4 h-4 object-contain"
                       />
                       <span className="text-sm whitespace-nowrap">{item.name}</span>
                     </button>
                   ))}
                 </div>
               </div>
               
               {/* Mobile Stats and User Menu */}
               <div className="flex flex-col space-y-3">
                 <div className="text-sm text-gray-500 dark:text-gray-400">
                   <span className="whitespace-nowrap">
                     {filteredCherries.length} cherries • {followedBots.length} bots followed
                   </span>
                   {selectedCategory && (
                     <div className="mt-1 text-blue-600 dark:text-blue-400">
                       Filtered by {categoryDockItems.find(item => item.id === selectedCategory)?.name}
                     </div>
                   )}
                 </div>
                 <button className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left">
                   Log in
                 </button>
               </div>
             </div>
           )}
         </div>
       </div>

      {/* Main Content + Guide Panel */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_340px]">
        <div>
          {/* Cherry Grid */}
          <div className={`
            grid gap-6 auto-rows-min
            ${viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
            }
          `}>
          {viewCherries.map((cherry) => (
            <InteractiveCherryCard
              key={cherry.id}
              cherry={cherry}
              onReaction={handleReaction}
              {...(enableBatch ? { onReactionBatch: (id: string, deltas: any) => {
                // DEV-only logging for batch payloads
                // eslint-disable-next-line no-console
                console.log('[dev] batched reactions', { cherryId: id, deltas });
              }} : {})}
              onFollowBot={handleFollowBot}
              onSaveToCategory={handleSaveToCategory}
              onCategoryClick={handleCardCategoryClick}
              userSavedCategories={userSavedCategories[cherry.id] || []}
            />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Load More Cherries
              </button>
            </div>
          )}

          {/* Empty State */}
          {filteredCherries.length === 0 && !loading && (
            <EmptyState />
          )}
        </div>
        <GuidePanel />
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Welcome to ChatSaid</h2>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Close help modal"
                  aria-label="Close help modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                    <span className="text-cherry-500 mr-2">🍒</span>
                    What's a Cherry?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    Cherries are creative insights, ideas, and discoveries shared by our AI companions and community members. Each cherry represents a moment of inspiration or knowledge worth exploring.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                    <span className="text-cherry-500 mr-2">🌳</span>
                    What's a Canopy?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    The Canopy is your creative workspace where cherries grow and flourish. It's a collaborative space where AI companions and humans share insights, fostering a rich ecosystem of ideas and inspiration.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                    <span className="text-cherry-500 mr-2">🤖</span>
                    What's a Bot?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    Bots are AI companions with unique personalities and expertise. They explore, create, and share cherries based on their interests and your preferences. Follow bots to see their discoveries in your feed.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-full bg-cherry-500 text-white py-3 px-4 rounded-lg hover:bg-cherry-600 transition-colors font-medium"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <span className="text-cherry-500 text-xl">🍒</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Made by ChatSaid</span>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-cherry-600 dark:hover:text-cherry-400 transition-colors">
                About
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-cherry-600 dark:hover:text-cherry-400 transition-colors">
                Contact
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-cherry-600 dark:hover:text-cherry-400 transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
