'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  X, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Save, 
  Zap,
  Clock,
  Star,
  Eye,
  Edit
} from 'lucide-react';

interface BotReport {
  id: number;
  kind: 'found_cherry' | 'follow_suggestion' | 'reply_suggestion' | 'save_suggestion' | 'react_suggestion';
  payload: {
    cherry_id?: string;
    cherry_title?: string;
    cherry_content?: string;
    cherry_author?: string;
    bot_id?: string;
    bot_name?: string;
    reply_text?: string;
    confidence?: number;
    reason?: string;
    category?: string;
    tags?: string[];
  };
  status: 'pending' | 'approved' | 'dismissed' | 'expired';
  confidence_score: number;
  created_at: string;
}

interface ReportCardProps {
  report: BotReport;
  onAction: (action: 'approve' | 'dismiss' | 'view' | 'edit') => void;
  compact?: boolean;
}

export default function ReportCard({ report, onAction, compact = false }: ReportCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: 'approve' | 'dismiss' | 'view' | 'edit') => {
    setIsProcessing(true);
    try {
      await onAction(action);
    } finally {
      setIsProcessing(false);
    }
  };

  const getReportIcon = () => {
    switch (report.kind) {
      case 'found_cherry':
      case 'save_suggestion':
        return <Save className="w-4 h-4" />;
      case 'follow_suggestion':
        return <UserPlus className="w-4 h-4" />;
      case 'reply_suggestion':
        return <MessageCircle className="w-4 h-4" />;
      case 'react_suggestion':
        return <Heart className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getReportColor = () => {
    switch (report.kind) {
      case 'found_cherry':
      case 'save_suggestion':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'follow_suggestion':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'reply_suggestion':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'react_suggestion':
        return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getReportTitle = () => {
    switch (report.kind) {
      case 'found_cherry':
        return 'Found Cherry';
      case 'save_suggestion':
        return 'Save Suggestion';
      case 'follow_suggestion':
        return 'Follow Suggestion';
      case 'reply_suggestion':
        return 'Reply Suggestion';
      case 'react_suggestion':
        return 'Reaction Suggestion';
      default:
        return 'Suggestion';
    }
  };

  const getReportDescription = () => {
    switch (report.kind) {
      case 'found_cherry':
        return `"${report.payload.cherry_title || 'Untitled Cherry'}" by ${report.payload.cherry_author || 'Unknown'}`;
      case 'save_suggestion':
        return `Save "${report.payload.cherry_title || 'this cherry'}" to your collection?`;
      case 'follow_suggestion':
        return `Follow ${report.payload.bot_name || 'this bot'}?`;
      case 'reply_suggestion':
        return `Reply: "${report.payload.reply_text?.substring(0, 50) || 'Suggested reply'}..."`;
      case 'react_suggestion':
        return `React to "${report.payload.cherry_title || 'this cherry'}"?`;
      default:
        return 'New suggestion available';
    }
  };

  const getConfidenceColor = () => {
    if (report.confidence_score >= 0.8) return 'text-green-400';
    if (report.confidence_score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (compact) {
    return (
      <motion.div
        className={`p-2 rounded-lg border ${getReportColor()} cursor-pointer transition-all`}
        whileHover={{ scale: 1.02 }}
        onClick={() => handleAction('view')}
      >
        <div className="flex items-center space-x-2">
          {getReportIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{getReportTitle()}</p>
            <p className="text-xs opacity-80 truncate">{getReportDescription()}</p>
          </div>
          <div className="flex items-center space-x-1">
            <span className={`text-xs ${getConfidenceColor()}`}>
              {Math.round(report.confidence_score * 100)}%
            </span>
            <Clock className="w-3 h-3 opacity-60" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`p-4 rounded-lg border ${getReportColor()} transition-all`}
      whileHover={{ scale: 1.01 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-lg ${getReportColor()}`}>
            {getReportIcon()}
          </div>
          <div>
            <h4 className="font-medium text-sm">{getReportTitle()}</h4>
            <p className="text-xs opacity-80">{formatTimeAgo(report.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${getConfidenceColor()}`}>
            {Math.round(report.confidence_score * 100)}% confidence
          </span>
          {report.payload.reason && (
            <div className="text-xs opacity-60">
              {report.payload.reason}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-sm mb-2">{getReportDescription()}</p>
        
        {report.payload.cherry_content && (
          <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-300 line-clamp-3">
              {report.payload.cherry_content}
            </p>
          </div>
        )}

        {report.payload.tags && report.payload.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {report.payload.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {report.payload.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                +{report.payload.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => handleAction('view')}
            disabled={isProcessing}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-lg transition-colors disabled:opacity-50"
          >
            <Eye className="w-3 h-3" />
            <span>View</span>
          </button>
          
          {report.kind === 'reply_suggestion' && (
            <button
              onClick={() => handleAction('edit')}
              disabled={isProcessing}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-lg transition-colors disabled:opacity-50"
            >
              <Edit className="w-3 h-3" />
              <span>Edit</span>
            </button>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleAction('dismiss')}
            disabled={isProcessing}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-red-600 text-gray-200 hover:text-white text-xs rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            <span>Dismiss</span>
          </button>
          
          <button
            onClick={() => handleAction('approve')}
            disabled={isProcessing}
            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-3 h-3" />
            <span>Approve</span>
          </button>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center"
        >
          <div className="flex items-center space-x-2 text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Processing...</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
