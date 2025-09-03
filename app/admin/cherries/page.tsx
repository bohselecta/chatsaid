'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { botProfileService } from '@/lib/botProfiles';

interface Cherry {
  id: string;
  title: string | null;
  content: string;
  privacy_level: 'private' | 'friends' | 'public';
  tags: string[] | null;
  source_file: string | null;
  line_number: number | null;
  image_url: string | null;
  review_status: string;
  is_featured: boolean;
  created_at: string;
  author_id: string;
  author_display_name: string;
  author_avatar: string | null;
  like_count: number;
  comment_count: number;
}

interface FilterOptions {
  privacy: string;
  reviewStatus: string;
  authorType: string;
  dateRange: string;
  search: string;
}

export default function AdminCherriesPage() {
  const [cherries, setCherries] = useState<Cherry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCherries, setSelectedCherries] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>({
    privacy: 'all',
    reviewStatus: 'all',
    authorType: 'all',
    dateRange: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCherries();
  }, [filters, currentPage]);

  const loadCherries = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cherries_view')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.privacy !== 'all') {
        query = query.eq('privacy_level', filters.privacy);
      }
      if (filters.reviewStatus !== 'all') {
        query = query.eq('review_status', filters.reviewStatus);
      }
      if (filters.authorType !== 'all') {
        if (filters.authorType === 'bots') {
          query = query.in('author_id', ['cherry_ent_bot', 'crystal_maize_bot']);
        } else if (filters.authorType === 'users') {
          query = query.not('author_id', 'in', ['cherry_ent_bot', 'crystal_maize_bot']);
        }
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      // Pagination
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) throw error;

      setCherries(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error loading cherries:', error);
      setMessage('❌ Error loading cherries');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'feature' | 'unfeature' | 'approve' | 'reject') => {
    if (selectedCherries.size === 0) {
      setMessage('Please select cherries to perform this action');
      return;
    }

    if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedCherries.size} cherries? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const cherryIds = Array.from(selectedCherries);
      
      switch (action) {
        case 'delete':
          await supabase
            .from('cherries')
            .delete()
            .in('id', cherryIds);
          break;
        
        case 'feature':
          await supabase
            .from('cherries')
            .update({ is_featured: true })
            .in('id', cherryIds);
          break;
        
        case 'unfeature':
          await supabase
            .from('cherries')
            .update({ is_featured: false })
            .in('id', cherryIds);
          break;
        
        case 'approve':
          await supabase
            .from('cherries')
            .update({ review_status: 'reviewed' })
            .in('id', cherryIds);
          break;
        
        case 'reject':
          await supabase
            .from('cherries')
            .update({ review_status: 'rejected' })
            .in('id', cherryIds);
          break;
      }

      setMessage(`✅ Successfully ${action}ed ${cherryIds.length} cherries`);
      setSelectedCherries(new Set());
      loadCherries();
    } catch (error) {
      console.error(`Error performing bulk action ${action}:`, error);
      setMessage(`❌ Error performing ${action} action`);
    } finally {
      setLoading(false);
    }
  };

  const toggleCherrySelection = (cherryId: string) => {
    const newSelection = new Set(selectedCherries);
    if (newSelection.has(cherryId)) {
      newSelection.delete(cherryId);
    } else {
      newSelection.add(cherryId);
    }
    setSelectedCherries(newSelection);
  };

  const toggleAllCherries = () => {
    if (selectedCherries.size === cherries.length) {
      setSelectedCherries(new Set());
    } else {
      setSelectedCherries(new Set(cherries.map(c => c.id)));
    }
  };

  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'private': return '🔒';
      case 'friends': return '👥';
      case 'public': return '🌍';
      default: return '🔒';
    }
  };

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'reviewed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const isBotCherry = (authorId: string) => {
    // Check if the author is one of the known bot IDs
    return ['cherry_ent_bot', 'crystal_maize_bot'].includes(authorId);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white">🍒 Cherry Management</h1>
          <p className="text-gray-300 mt-2">
            Manage all cherries on ChatSaid - moderate content, feature posts, and maintain quality
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">🔍 Filters & Search</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <input
              type="text"
              placeholder="Search content..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            
            <select
              value={filters.privacy}
              onChange={(e) => setFilters({ ...filters, privacy: e.target.value })}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Filter by privacy level"
              aria-label="Filter by privacy level"
            >
              <option value="all">All Privacy</option>
              <option value="private">Private</option>
              <option value="friends">Friends</option>
              <option value="public">Public</option>
            </select>

            <select
              value={filters.reviewStatus}
              onChange={(e) => setFilters({ ...filters, reviewStatus: e.target.value })}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Filter by review status"
              aria-label="Filter by review status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filters.authorType}
              onChange={(e) => setFilters({ ...filters, authorType: e.target.value })}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Filter by author type"
              aria-label="Filter by author type"
            >
              <option value="all">All Authors</option>
              <option value="users">Users Only</option>
              <option value="bots">Bots Only</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Filter by date range"
              aria-label="Filter by date range"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <button
              onClick={() => setFilters({
                privacy: 'all',
                reviewStatus: 'all',
                authorType: 'all',
                dateRange: 'all',
                search: ''
              })}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCherries.size > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-white">
                {selectedCherries.size} cherry{selectedCherries.size !== 1 ? 'ies' : 'y'} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('feature')}
                  className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                >
                  ⭐ Feature
                </button>
                <button
                  onClick={() => handleBulkAction('unfeature')}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  📌 Unfeature
                </button>
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  ❌ Reject
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-2 bg-red-800 hover:bg-red-900 text-white rounded transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cherries Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCherries.size === cherries.length && cherries.length > 0}
                      onChange={toggleAllCherries}
                      className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
                      title="Select all cherries"
                      aria-label="Select all cherries"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-white font-medium">Content</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Author</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Privacy</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Featured</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Created</th>
                  <th className="px-4 py-3 text-left text-white font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      Loading cherries...
                    </td>
                  </tr>
                ) : cherries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      No cherries found matching your filters
                    </td>
                  </tr>
                ) : (
                  cherries.map((cherry) => (
                    <tr key={cherry.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCherries.has(cherry.id)}
                          onChange={() => toggleCherrySelection(cherry.id)}
                          className="rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
                          title={`Select cherry by ${cherry.author_display_name}`}
                          aria-label={`Select cherry by ${cherry.author_display_name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          {cherry.title && (
                            <div className="font-medium text-white mb-1 line-clamp-1">
                              {cherry.title}
                            </div>
                          )}
                          <div className="text-gray-300 text-sm line-clamp-2">
                            {cherry.content}
                          </div>
                          {cherry.tags && cherry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {cherry.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                                  #{tag}
                                </span>
                              ))}
                              {cherry.tags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                                  +{cherry.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {cherry.author_avatar ? (
                            <img
                              src={cherry.author_avatar}
                              alt={cherry.author_display_name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">👤</span>
                            </div>
                          )}
                          <div>
                            <div className="text-white font-medium">
                              {cherry.author_display_name}
                            </div>
                            {isBotCherry(cherry.author_id) && (
                              <span className="text-xs text-purple-400">🤖 Bot</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-lg">{getPrivacyIcon(cherry.privacy_level)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getReviewStatusColor(cherry.review_status)}`}>
                          {cherry.review_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {cherry.is_featured ? (
                          <span className="text-yellow-400">⭐</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(cherry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(`/cherry/${cherry.id}`, '_blank')}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                            title="View cherry"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleBulkAction(cherry.is_featured ? 'unfeature' : 'feature')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              cherry.is_featured
                                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            }`}
                            title={cherry.is_featured ? 'Unfeature' : 'Feature'}
                          >
                            {cherry.is_featured ? '📌' : '⭐'}
                          </button>
                          <button
                            onClick={() => handleBulkAction('delete')}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                            title="Delete cherry"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
            <p className="text-white">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
