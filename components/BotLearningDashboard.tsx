'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Lightbulb, Target, Award, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { BotLearningService, BotLearningInsights, LearningPattern, UserFeedback } from '@/lib/botLearningService';
import { BotPersonality } from '@/lib/aiBotService';

interface BotLearningDashboardProps {
  botId: string;
  botName: string;
  botPersonality: BotPersonality;
}

export default function BotLearningDashboard({ botId, botName, botPersonality }: BotLearningDashboardProps) {
  const [insights, setInsights] = useState<BotLearningInsights | null>(null);
  const [learningProgress, setLearningProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    feedbackType: 'positive' as 'positive' | 'negative' | 'neutral',
    feedbackScore: 5,
    userComment: ''
  });

  useEffect(() => {
    loadLearningData();
  }, [botId]);

  const loadLearningData = async () => {
    try {
      setIsLoading(true);
      const [insightsData, progressData] = await Promise.all([
        BotLearningService.getBotLearningInsights(botId),
        BotLearningService.getLearningProgressSummary(botId)
      ]);
      
      setInsights(insightsData);
      setLearningProgress(progressData);
    } catch (error) {
      console.error('Error loading learning data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await BotLearningService.trackUserFeedback(
        botId,
        'cherry_id_placeholder', // This would come from the actual cherry context
        feedbackData.feedbackType,
        feedbackData.feedbackScore / 5, // Convert 1-5 scale to 0-1
        feedbackData.userComment,
        {
          bot_personality: botPersonality.conversation_style,
          expertise_areas: botPersonality.expertise_areas,
          response_length: botPersonality.response_length
        }
      );

      // Reset form and close
      setFeedbackData({
        feedbackType: 'positive',
        feedbackScore: 5,
        userComment: ''
      });
      setShowFeedbackForm(false);
      
      // Reload data to show updated insights
      loadLearningData();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getLearningStatusColor = (status: string) => {
    switch (status) {
      case 'advanced': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'beginner': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getLearningStatusIcon = (status: string) => {
    switch (status) {
      case 'advanced': return '🏆';
      case 'intermediate': return '📚';
      case 'beginner': return '🌱';
      default: return '🤖';
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
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Learning Dashboard</h2>
            <p className="text-gray-400">Track {botName}&apos;s learning progress and insights</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowFeedbackForm(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Provide Feedback
        </button>
      </div>

      {/* Learning Progress Overview */}
      {learningProgress && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Learning Status</p>
                <p className={`text-2xl font-bold ${getLearningStatusColor(learningProgress.learningStatus)}`}>
                  {getLearningStatusIcon(learningProgress.learningStatus)} {learningProgress.learningStatus}
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Patterns</p>
                <p className="text-2xl font-bold text-white">{learningProgress.totalPatterns}</p>
              </div>
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-white">{(learningProgress.averageSuccess * 100).toFixed(1)}%</p>
              </div>
              <Award className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Improvement</p>
                <p className={`text-2xl font-bold ${learningProgress.improvementRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {learningProgress.improvementRate > 0 ? '+' : ''}{(learningProgress.improvementRate * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* Learning Insights */}
      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Patterns */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-white">Top Performing Patterns</h3>
            </div>
            
            <div className="space-y-3">
              {insights.top_performing_patterns.map((pattern, index) => (
                <div key={pattern.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white capitalize">
                        {pattern.pattern_type.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-400">
                        Used {pattern.usage_count} times
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">
                      {(pattern.success_score * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">Success Rate</div>
                  </div>
                </div>
              ))}
              
              {insights.top_performing_patterns.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No patterns learned yet</p>
                  <p className="text-sm">Start interacting with the bot to see learning progress</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Improvements */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-white">Recent Improvements</h3>
            </div>
            
            <div className="space-y-3">
              {insights.recent_improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-200 text-sm">{improvement}</p>
                </div>
              ))}
              
              {insights.recent_improvements.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No recent improvements</p>
                  <p className="text-sm">Keep interacting to see learning progress</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Learning Recommendations */}
      {insights && insights.learning_recommendations.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-white">Learning Recommendations</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.learning_recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                <p className="text-gray-200 text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Provide Feedback</h3>
              </div>
              <button
                onClick={() => setShowFeedbackForm(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close feedback form"
                title="Close feedback form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="p-6 space-y-4">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  How was this bot response?
                </label>
                <div className="flex gap-2">
                  {(['positive', 'neutral', 'negative'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFeedbackData(prev => ({ ...prev, feedbackType: type }))}
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors
                        ${feedbackData.feedbackType === type
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        }
                      `}
                    >
                      {type === 'positive' && <ThumbsUp className="w-4 h-4" />}
                      {type === 'neutral' && <MessageCircle className="w-4 h-4" />}
                      {type === 'negative' && <ThumbsDown className="w-4 h-4" />}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Score */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rate this response (1-5)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFeedbackData(prev => ({ ...prev, feedbackScore: score }))}
                      className={`
                        w-10 h-10 rounded-lg border transition-colors flex items-center justify-center
                        ${feedbackData.feedbackScore >= score
                          ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                          : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        }
                      `}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={feedbackData.userComment}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, userComment: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="What did you like or dislike about this response?"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFeedbackForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
