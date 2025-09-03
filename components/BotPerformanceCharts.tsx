'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Activity, MessageCircle, Users, Calendar } from 'lucide-react';
import { BotAnalyticsService, BotTrendData } from '@/lib/botAnalyticsService';

interface BotPerformanceChartsProps {
  botId: string;
  botName: string;
}

export default function BotPerformanceCharts({ botId, botName }: BotPerformanceChartsProps) {
  const [trendData, setTrendData] = useState<BotTrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    loadTrendData();
  }, [botId, timeRange]);

  const loadTrendData = async () => {
    try {
      setIsLoading(true);
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const data = await BotAnalyticsService.getBotTrendData(botId, days);
      setTrendData(data);
    } catch (error) {
      console.error('Error loading trend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMaxValue = (data: BotTrendData[], key: keyof BotTrendData) => {
    if (data.length === 0) return 1;
    const max = Math.max(...data.map(d => Number(d[key])));
    return max === 0 ? 1 : max;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === '7d') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (timeRange === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Performance Analytics</h3>
          <p className="text-gray-400">Track {botName}&apos;s engagement over time</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`
                px-3 py-1 rounded text-sm font-medium transition-colors
                ${timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {trendData.reduce((sum, day) => sum + day.interactions, 0)}
              </p>
              <p className="text-gray-400 text-sm">Total Interactions</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {trendData.reduce((sum, day) => sum + day.comments, 0)}
              </p>
              <p className="text-gray-400 text-sm">Total Comments</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {trendData.length > 0 
                  ? (trendData.reduce((sum, day) => sum + day.engagement_score, 0) / trendData.length).toFixed(1)
                  : '0'
                }%
              </p>
              <p className="text-gray-400 text-sm">Avg Engagement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactions Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-400" />
            <h4 className="font-semibold text-white">Daily Interactions</h4>
          </div>
          
          <div className="space-y-2">
            {trendData.map((day, index) => {
              const maxInteractions = getMaxValue(trendData, 'interactions');
              const height = (day.interactions / maxInteractions) * 100;
              
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-gray-400">
                    {formatDate(day.date)}
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${height}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-white">
                    {day.interactions}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h4 className="font-semibold text-white">Engagement Rate</h4>
          </div>
          
          <div className="space-y-2">
            {trendData.map((day, index) => {
              const maxEngagement = getMaxValue(trendData, 'engagement_score');
              const height = (day.engagement_score / maxEngagement) * 100;
              
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-gray-400">
                    {formatDate(day.date)}
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${height}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm text-white">
                    {day.engagement_score.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comments vs Interactions Line Chart */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <h4 className="font-semibold text-white">Comments vs Interactions Trend</h4>
        </div>
        
        <div className="relative h-64">
          {/* Chart Grid */}
          <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-500">
            {[100, 75, 50, 25, 0].map((percent) => (
              <div key={percent} className="flex items-center">
                <span className="w-12 text-right">{percent}%</span>
                <div className="flex-1 border-t border-gray-700 ml-2" />
              </div>
            ))}
          </div>
          
          {/* Data Points */}
          <div className="absolute inset-0 ml-16 flex items-end justify-between">
            {trendData.map((day, index) => {
              const maxValue = Math.max(
                getMaxValue(trendData, 'interactions'),
                getMaxValue(trendData, 'comments')
              );
              
              const interactionHeight = (day.interactions / maxValue) * 100;
              const commentHeight = (day.comments / maxValue) * 100;
              
              return (
                <div key={day.date} className="flex flex-col items-center gap-2">
                  {/* Interaction Bar */}
                  <div className="w-3 bg-blue-500 rounded-t" style={{ height: `${interactionHeight}%` }} />
                  
                  {/* Comment Bar */}
                  <div className="w-3 bg-purple-500 rounded-t" style={{ height: `${commentHeight}%` }} />
                  
                  {/* Date Label */}
                  <div className="text-xs text-gray-400 -rotate-45 origin-top-left">
                    {formatDate(day.date)}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-0 right-0 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-gray-300">Interactions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span className="text-gray-300">Comments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-yellow-400" />
          <h4 className="font-semibold text-white">Performance Insights</h4>
        </div>
        
        <div className="space-y-3">
          {trendData.length > 0 && (
            <>
              {/* Best Day */}
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Best Performing Day</span>
                <span className="text-white font-medium">
                  {formatDate(trendData.reduce((best, current) => 
                    current.interactions > best.interactions ? current : best
                  ).date)}
                </span>
              </div>
              
              {/* Engagement Trend */}
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Engagement Trend</span>
                <span className="text-white font-medium">
                  {trendData.length >= 2 ? (
                    trendData[trendData.length - 1].engagement_score > trendData[0].engagement_score
                      ? '📈 Improving'
                      : '📉 Declining'
                  ) : '➡️ Stable'}
                </span>
              </div>
              
              {/* Consistency Score */}
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Consistency Score</span>
                <span className="text-white font-medium">
                  {(() => {
                    const interactions = trendData.map(d => d.interactions);
                    const mean = interactions.reduce((a, b) => a + b, 0) / interactions.length;
                    const variance = interactions.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / interactions.length;
                    const stdDev = Math.sqrt(variance);
                    const consistency = Math.max(0, 100 - (stdDev / mean) * 100);
                    return `${Math.round(consistency)}%`;
                  })()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
