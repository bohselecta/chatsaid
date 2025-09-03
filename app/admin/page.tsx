'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface AdminStats {
  totalCherries: number;
  totalUsers: number;
  totalBots: number;
  pendingReview: number;
  featuredCherries: number;
  recentActivity: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalCherries: 0,
    totalUsers: 0,
    totalBots: 0,
    pendingReview: 0,
    featuredCherries: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      // Load various statistics
      const [
        { count: cherriesCount },
        { count: usersCount },
        { count: pendingCount },
        { count: featuredCount },
        { count: recentCount }
      ] = await Promise.all([
        supabase.from('cherries').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('cherries').select('*', { count: 'exact', head: true }).eq('review_status', 'pending'),
        supabase.from('cherries').select('*', { count: 'exact', head: true }).eq('is_featured', true),
        supabase.from('cherries').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      setStats({
        totalCherries: cherriesCount || 0,
        totalUsers: usersCount || 0,
        totalBots: 2, // Cherry_Ent and Crystal_Maize
        pendingReview: pendingCount || 0,
        featuredCherries: featuredCount || 0,
        recentActivity: recentCount || 0
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminCards = [
    {
      title: 'Cherry Management',
      description: 'View, moderate, and manage all cherries on the site',
      icon: '🍒',
      href: '/admin/cherries',
      color: 'from-red-500 to-pink-500',
      stats: `${stats.totalCherries} total cherries`
    },
    {
      title: 'AI Bot Administration',
      description: 'Manage Cherry_Ent and Crystal_Maize personas',
      icon: '🤖',
      href: '/admin/bots',
      color: 'from-purple-500 to-indigo-500',
      stats: `${stats.totalBots} active bots`
    },
    {
      title: 'Cherry Punt System',
      description: 'AI-powered content safety and user moderation',
      icon: '🚫',
      href: '/admin/punts',
      color: 'from-orange-500 to-red-500',
      stats: 'AI Safety Active'
    },
    {
      title: 'Content Moderation',
      description: 'Review pending content and maintain quality',
      icon: '🛡️',
      href: '/admin/cherries?reviewStatus=pending',
      color: 'from-yellow-500 to-orange-500',
      stats: `${stats.pendingReview} pending review`
    },
    {
      title: 'Featured Content',
      description: 'Manage featured cherries and highlights',
      icon: '⭐',
      href: '/admin/cherries?featured=true',
      color: 'from-green-500 to-emerald-500',
      stats: `${stats.featuredCherries} featured cherries`
    }
  ];

  const quickActions = [
    {
      title: 'Feature Recent Cherry',
      description: 'Quickly feature a high-quality post',
      icon: '⭐',
      action: () => {/* Quick action logic */}
    },
    {
      title: 'Review Pending',
      description: 'Review cherries awaiting approval',
      icon: '👁️',
      action: () => {/* Quick action logic */}
    },
    {
      title: 'Bot Status',
      description: 'Check AI persona posting status',
      icon: '🤖',
      action: () => {/* Quick action logic */}
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white">⚙️ Admin Dashboard</h1>
          <p className="text-gray-300 mt-2">
            Manage ChatSaid - monitor activity, moderate content, and maintain quality
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Cherries</p>
                <p className="text-2xl font-bold text-white">{loading ? '...' : stats.totalCherries}</p>
              </div>
              <div className="text-3xl">🍒</div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{loading ? '...' : stats.totalUsers}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-400">{loading ? '...' : stats.pendingReview}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Featured</p>
                <p className="text-2xl font-bold text-yellow-400">{loading ? '...' : stats.featuredCherries}</p>
              </div>
              <div className="text-3xl">⭐</div>
            </div>
          </div>
        </div>

        {/* Main Admin Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {adminCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="bg-gray-800 rounded-lg p-6 border border-gray-600 hover:border-gray-500 transition-all hover:scale-105"
            >
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center text-2xl`}>
                  {card.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{card.title}</h3>
                  <p className="text-gray-300 text-sm mb-3">{card.description}</p>
                  <div className="text-sm text-gray-400">{card.stats}</div>
                </div>
                <div className="text-gray-400 text-xl">→</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.action}
                className="p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-all text-left"
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <h3 className="font-medium text-white mb-1">{action.title}</h3>
                <p className="text-gray-300 text-sm">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
          <h2 className="text-xl font-semibold text-white mb-4">📊 Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍒</span>
                <div>
                  <p className="text-white font-medium">New cherries posted</p>
                  <p className="text-gray-400 text-sm">{stats.recentActivity} in the last 24 hours</p>
                </div>
              </div>
              <Link
                href="/admin/cherries"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                View All
              </Link>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="text-white font-medium">Content pending review</p>
                  <p className="text-gray-400 text-sm">{stats.pendingReview} cherries need attention</p>
                </div>
              </div>
              <Link
                href="/admin/cherries?reviewStatus=pending"
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
              >
                Review Now
              </Link>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="text-white font-medium">AI Bot Status</p>
                  <p className="text-gray-400 text-sm">Check bot posting schedules and performance</p>
                </div>
              </div>
              <Link
                href="/admin/bots"
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
              >
                Manage Bots
              </Link>
            </div>
          </div>
        </div>

        {/* Admin Tips */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">💡 Admin Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-white mb-2">Content Moderation</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Review pending cherries daily</li>
                <li>• Use bulk actions for efficiency</li>
                <li>• Feature high-quality content</li>
                <li>• Monitor for inappropriate content</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">AI Bot Management</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Monitor bot posting schedules</li>
                <li>• Check AI-generated content quality</li>
                <li>• Adjust posting frequency as needed</li>
                <li>• Review bot performance metrics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
