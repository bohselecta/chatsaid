'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Tag, User, MessageCircle, BookOpen, Send, Eye, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';

interface DigestItem {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  score: number;
  tldr?: string;
  provenance: {
    reason: string;
    matchType: string;
    confidence: number;
  };
  actions: {
    canOpen: boolean;
    canReply: boolean;
    canSave: boolean;
    canPing: boolean;
  };
}

interface DigestResult {
  highlights: DigestItem[];
  totalItems: number;
  timeWindow: {
    start: string;
    end: string;
  };
  summary: string;
  continueToken?: string;
}

interface DigestOverlayProps {
  digest: DigestResult;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, item: DigestItem) => void;
}

export default function DigestOverlay({ 
  digest, 
  isOpen, 
  onClose, 
  onAction 
}: DigestOverlayProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showScoring, setShowScoring] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'funny': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'weird': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'technical': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'research': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'ideas': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getProvenanceIcon = (matchType: string) => {
    switch (matchType) {
      case 'tag_match': return <Tag className="w-3 h-3" />;
      case 'category_match': return <BookOpen className="w-3 h-3" />;
      case 'person_follow': return <User className="w-3 h-3" />;
      case 'keyword_match': return <MessageCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cherry-500 to-cherry-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Sleep Delta Digest
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {digest.highlights.length} highlights • {digest.totalItems} total items
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowScoring(!showScoring)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Show scoring details"
            >
              <BarChart3 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Close digest"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="p-6 bg-gradient-to-r from-cherry-50 to-cherry-100 dark:from-cherry-900 dark:to-cherry-800 border-b border-cherry-200 dark:border-cherry-700">
          <p className="text-cherry-800 dark:text-cherry-200 font-medium">
            {digest.summary}
          </p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-cherry-600 dark:text-cherry-300">
            <span>Time window: {new Date(digest.timeWindow.start).toLocaleString()} - {new Date(digest.timeWindow.end).toLocaleString()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {digest.highlights.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No new cherries found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Your watchlist didn't match any new content since your last visit.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {digest.highlights.map((item, index) => (
                <DigestItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  isExpanded={expandedItems.has(item.id)}
                  onToggleExpanded={() => toggleExpanded(item.id)}
                  onAction={onAction}
                  getCategoryColor={getCategoryColor}
                  getProvenanceIcon={getProvenanceIcon}
                  showScoring={showScoring}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Powered by AI • Personalized for your interests
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onAction('continue_scan', digest.highlights[0])}
                className="px-4 py-2 bg-cherry-500 text-white rounded-lg hover:bg-cherry-600 transition-colors text-sm font-medium"
              >
                Continue Deep Scan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DigestItemCardProps {
  item: DigestItem;
  index: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onAction: (action: string, item: DigestItem) => void;
  getCategoryColor: (category: string) => string;
  getProvenanceIcon: (matchType: string) => React.ReactNode;
  showScoring: boolean;
}

function DigestItemCard({
  item,
  index,
  isExpanded,
  onToggleExpanded,
  onAction,
  getCategoryColor,
  getProvenanceIcon,
  showScoring
}: DigestItemCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                #{index + 1}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                {item.category}
              </span>
              {showScoring && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Score: {(item.score * 100).toFixed(1)}%
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {item.title}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {item.tldr || item.content.substring(0, 150) + '...'}
            </p>

            {/* Provenance */}
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                {getProvenanceIcon(item.provenance.matchType)}
                <span>{item.provenance.reason}</span>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Confidence: {(item.provenance.confidence * 100).toFixed(0)}%
              </div>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    +{item.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onToggleExpanded}
            className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onAction('open', item)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-cherry-500 text-white rounded-lg hover:bg-cherry-600 transition-colors text-sm"
          >
            <Eye className="w-3 h-3" />
            <span>Open</span>
          </button>
          
          {item.actions.canSave && (
            <button
              onClick={() => onAction('save', item)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              <BookOpen className="w-3 h-3" />
              <span>Save</span>
            </button>
          )}
          
          {item.actions.canPing && (
            <button
              onClick={() => onAction('ping', item)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <Send className="w-3 h-3" />
              <span>Ping Author</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
          <div className="pt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Full Content
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {item.content}
            </p>
          </div>
          
          {showScoring && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Why am I seeing this?
              </h4>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>Match type: {item.provenance.matchType}</p>
                <p>Confidence: {(item.provenance.confidence * 100).toFixed(1)}%</p>
                <p>Overall score: {(item.score * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
