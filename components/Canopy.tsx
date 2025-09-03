'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Branch from './Branch';

interface Branch {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  is_primary: boolean;
}

interface Cherry {
  id: string;
  title?: string;
  content: string;
  image_url?: string;
  source_file?: string;
  line_number?: number;
  created_at: string;
  tags?: string[];
  review_status: string;
}

export default function Canopy() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cherries, setCherries] = useState<Record<string, Cherry[]>>({});
  const [activeBranch, setActiveBranch] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadBranches();
    loadCherries();
  }, []);

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (error) throw error;
      setBranches(data || []);
      
      // Initialize expanded state for all branches
      const expandedState: Record<string, boolean> = {};
      data?.forEach(branch => {
        expandedState[branch.slug] = true;
      });
      setExpandedBranches(expandedState);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const loadCherries = async () => {
    try {
      setLoading(true);
      
      // Load cherries for each branch
      const cherriesByBranch: Record<string, Cherry[]> = {};
      
      for (const branch of branches) {
        const { data, error } = await supabase
          .from('cherries')
          .select(`
            id,
            title,
            content,
            image_url,
            source_file,
            line_number,
            created_at,
            tags,
            review_status
          `)
          .eq('privacy_level', 'public')
          .order('created_at', { ascending: false })
          .limit(50); // Limit for performance

        if (error) {
          console.error(`Error loading cherries for ${branch.slug}:`, error);
          cherriesByBranch[branch.slug] = [];
        } else {
          cherriesByBranch[branch.slug] = data || [];
        }
      }
      
      setCherries(cherriesByBranch);
    } catch (error) {
      console.error('Error loading cherries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchToggle = (branchSlug: string) => {
    setExpandedBranches(prev => ({
      ...prev,
      [branchSlug]: !prev[branchSlug]
    }));
  };

  const filteredBranches = activeBranch === 'all' 
    ? branches 
    : branches.filter(branch => branch.slug === activeBranch);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading canopy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Branch Navigation Tabs */}
      <div className="sticky top-0 z-20 bg-gray-800 border-b border-gray-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-1 py-4">
            {/* All Branches Tab */}
            <button
              onClick={() => setActiveBranch('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeBranch === 'all'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              All Branches
            </button>
            
            {/* Individual Branch Tabs */}
            {branches.map((branch) => (
              <button
                key={branch.slug}
                onClick={() => setActiveBranch(branch.slug)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeBranch === branch.slug
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                style={{
                  borderColor: branch.color.startsWith('#') ? branch.color : `#${branch.color}`
                }}
              >
                <img 
                  src={`/${branch.icon}.png`} 
                  alt={branch.name}
                  className="w-4 h-4"
                />
                {branch.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Branches Content */}
      <div className="space-y-8">
        {filteredBranches.map((branch) => (
          <Branch
            key={branch.id}
            branch={branch}
            cherries={cherries[branch.slug] || []}
            isExpanded={expandedBranches[branch.slug] || false}
            onToggle={() => handleBranchToggle(branch.slug)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredBranches.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
            <span className="text-gray-500 text-4xl">🌳</span>
          </div>
          <p className="text-gray-400 text-lg">No branches found</p>
          <p className="text-gray-500 text-sm mt-2">
            Branches will appear here once they&apos;re created
          </p>
        </div>
      )}
    </div>
  );
}
