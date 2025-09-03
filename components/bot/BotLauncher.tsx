'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MessageCircle, Sparkles } from 'lucide-react';
import { useBotReports } from '@/lib/hooks/useBotReports';

interface BotLauncherProps {
  onOpen: () => void;
  className?: string;
}

export default function BotLauncher({ onOpen, className = '' }: BotLauncherProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { reports, unreadCount } = useBotReports();

  const hasUnread = unreadCount > 0;

  return (
    <motion.div
      className={`fixed bottom-4 right-4 z-40 ${className}`}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Main Launcher Button */}
      <motion.button
        data-testid="bot-launcher"
        onClick={onOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative w-14 h-14 rounded-full shadow-lg transition-all duration-300
          ${hasUnread 
            ? 'bg-gradient-to-r from-cherry-500 to-cherry-600 shadow-cherry-500/30' 
            : 'bg-[#1e1e1e] hover:bg-[#2a2a2a] shadow-gray-900/50'
          }
          border border-gray-700 hover:border-cherry-500/50
          flex items-center justify-center
          ${isHovered ? 'scale-110' : 'scale-100'}
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Bot Icon */}
        <motion.div
          animate={{ 
            rotate: isHovered ? 360 : 0,
            scale: hasUnread ? 1.1 : 1
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {hasUnread ? (
            <Sparkles className="w-6 h-6 text-white" />
          ) : (
            <Bot className="w-6 h-6 text-white" />
          )}
        </motion.div>

        {/* Unread Count Badge */}
        <AnimatePresence>
          {hasUnread && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-[#1e1e1e]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse Animation for Unread */}
        <AnimatePresence>
          {hasUnread && (
            <motion.div
              initial={{ opacity: 0, scale: 1 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [1, 1.2, 1]
              }}
              exit={{ opacity: 0, scale: 1 }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute inset-0 rounded-full bg-cherry-500/30"
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-16 top-1/2 transform -translate-y-1/2"
          >
            <div className="bg-[#1e1e1e] text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700 whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-cherry-400" />
                <span className="text-sm font-medium">
                  {hasUnread 
                    ? `${unreadCount} new suggestion${unreadCount > 1 ? 's' : ''}`
                    : 'Chat with your assistant'
                  }
                </span>
              </div>
              {/* Tooltip Arrow */}
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-[#1e1e1e] border-t-4 border-t-transparent border-b-4 border-b-transparent" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Indicator */}
      <motion.div
        className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#1e1e1e]"
        animate={{
          backgroundColor: hasUnread ? '#10b981' : '#6b7280'
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="w-full h-full rounded-full"
          animate={{
            backgroundColor: hasUnread ? '#10b981' : '#6b7280',
            boxShadow: hasUnread 
              ? '0 0 8px rgba(16, 185, 129, 0.6)' 
              : '0 0 4px rgba(107, 114, 128, 0.3)'
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
}
