'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { type BotTwin } from '@/lib/botTwinService';

interface BotTwinCreatorProps {
  apiKey: string;
  onBotTwinCreated: (botTwin: BotTwin) => void;
  botTwinService: any;
}

export default function BotTwinCreator({ apiKey, onBotTwinCreated, botTwinService }: BotTwinCreatorProps) {
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedBot, setGeneratedBot] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    if (!apiKey) {
      setError('Please enter your OpenAI API key');
      return;
    }

    if (!botTwinService) {
      setError('Bot Twin service not initialized');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const botTwin = await botTwinService.generateBotTwin(user.id, userInput);
      setGeneratedBot(botTwin);
      onBotTwinCreated(botTwin);
    } catch (error: any) {
      console.error('Error creating bot twin:', error);
      setError(error.message || 'Failed to create bot twin');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
      <h2 className="text-xl font-bold mb-4">🤖 Create Your Bot Twin</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userInput" className="block text-sm font-medium text-gray-300 mb-2">
            Tell me about yourself
          </label>
          <textarea
            id="userInput"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Share your thoughts, interests, writing style, or anything that makes you unique. Your bot twin will be generated from this text!"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            rows={6}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            The more detail you provide, the more unique your bot twin will be!
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 px-3 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isGenerating || !userInput.trim() || !apiKey}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating Bot Twin...
            </>
          ) : (
            '🧠 Generate Bot Twin'
          )}
        </button>
      </form>

      {/* Generation Tips */}
      <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
        <h3 className="font-medium text-gray-200 mb-2">💡 Tips for a Great Bot Twin:</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Share your sense of humor and communication style</li>
          <li>• Mention your interests, hobbies, or passions</li>
          <li>• Include any quirks or unique characteristics</li>
          <li>• Describe how you approach conversations</li>
          <li>• Add some personality traits or values</li>
        </ul>
      </div>

      {/* Example Input */}
      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h3 className="font-medium text-blue-200 mb-2">📝 Example:</h3>
        <p className="text-sm text-blue-300">
          &quot;I&apos;m a curious person who loves asking questions and exploring ideas. I have a dry sense of humor 
          and often use metaphors to explain things. I&apos;m passionate about technology, coffee, and learning 
          new things. I tend to be thoughtful in conversations and enjoy deep discussions about philosophy 
          and science.&quot;
        </p>
      </div>
    </div>
  );
}

