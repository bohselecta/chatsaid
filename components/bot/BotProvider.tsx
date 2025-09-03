'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import BotLauncher from './BotLauncher';
import BotAssistant from './BotAssistant';
import { DraftProvider } from '@/lib/assistant/draft';

interface BotContextType {
  isOpen: boolean;
  openBot: () => void;
  closeBot: () => void;
  toggleBot: () => void;
}

const BotContext = createContext<BotContextType | undefined>(undefined);

export function useBot() {
  const context = useContext(BotContext);
  if (context === undefined) {
    throw new Error('useBot must be used within a BotProvider');
  }
  return context;
}

interface BotProviderProps {
  children: React.ReactNode;
}

export default function BotProvider({ children }: BotProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openBot = () => setIsOpen(true);
  const closeBot = () => setIsOpen(false);
  const toggleBot = () => setIsOpen(prev => !prev);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + B to toggle bot
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        toggleBot();
      }
      
      // Escape to close bot
      if (event.key === 'Escape' && isOpen) {
        closeBot();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleBot]);

  // Handle click outside to close bot
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Don't close if clicking on bot components
      if (target.closest('[data-bot-component]')) {
        return;
      }
      
      closeBot();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const contextValue: BotContextType = {
    isOpen,
    openBot,
    closeBot,
    toggleBot
  };

  return (
    <BotContext.Provider value={contextValue}>
      {children}
      {/* Bot Components wrapped with DraftProvider so skills can push into draft */}
      <DraftProvider>
        <div data-bot-component>
          <BotLauncher onOpen={openBot} />
          <BotAssistant isOpen={isOpen} onClose={closeBot} />
        </div>
      </DraftProvider>
    </BotContext.Provider>
  );
}
