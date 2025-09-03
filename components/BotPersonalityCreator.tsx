'use client';

import { useState } from 'react';
import { Bot, Sparkles, Save, X, Palette, MessageCircle, Brain, Zap } from 'lucide-react';
import { AIBotService, BotPersonality } from '@/lib/aiBotService';

interface BotPersonalityCreatorProps {
  onBotCreated?: (bot: BotPersonality) => void;
  onClose?: () => void;
}

export default function BotPersonalityCreator({ onBotCreated, onClose }: BotPersonalityCreatorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    conversation_style: 'friendly' as 'friendly' | 'professional' | 'casual' | 'philosophical' | 'humorous',
    expertise_areas: [''],
    response_length: 'medium' as 'short' | 'medium' | 'long',
    avatar_url: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const conversationStyles = [
    { value: 'friendly' as const, label: 'Friendly', icon: '😊', description: 'Warm, encouraging, and supportive' },
    { value: 'professional' as const, label: 'Professional', icon: '📊', description: 'Analytical, thoughtful, and precise' },
    { value: 'casual' as const, label: 'Casual', icon: '😎', description: 'Relaxed, approachable, and conversational' },
    { value: 'philosophical' as const, label: 'Philosophical', icon: '🤔', description: 'Deep, contemplative, and thought-provoking' },
    { value: 'humorous' as const, label: 'Humorous', icon: '😄', description: 'Fun, entertaining, and lighthearted' }
  ];

  const responseLengths = [
    { value: 'short' as const, label: 'Short', description: 'Quick, concise responses' },
    { value: 'medium' as const, label: 'Medium', description: 'Balanced, informative responses' },
    { value: 'long' as const, label: 'Long', description: 'Detailed, comprehensive responses' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Bot name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Bot name must be at least 2 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (formData.expertise_areas.length === 0 || !formData.expertise_areas[0].trim()) {
      newErrors.expertise_areas = 'At least one expertise area is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsCreating(true);
      
      // Filter out empty expertise areas
      const cleanExpertiseAreas = formData.expertise_areas.filter(area => area.trim());
      
      // Create bot personality (this would integrate with your backend)
      const newBot: Partial<BotPersonality> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        conversation_style: formData.conversation_style,
        expertise_areas: cleanExpertiseAreas,
        response_length: formData.response_length,
        avatar_url: formData.avatar_url || undefined,
        is_active: true
      };

      // For now, we'll simulate creation
      // In a real app, you'd call AIBotService.createBotPersonality(newBot)
      console.log('Creating bot personality:', newBot);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a mock bot with generated ID
      const createdBot: BotPersonality = {
        id: `bot_${Date.now()}`,
        ...newBot,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as BotPersonality;

      onBotCreated?.(createdBot);
      onClose?.();
      
    } catch (error) {
      console.error('Error creating bot personality:', error);
      setErrors({ submit: 'Failed to create bot personality. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  const addExpertiseArea = () => {
    setFormData(prev => ({
      ...prev,
      expertise_areas: [...prev.expertise_areas, '']
    }));
  };

  const removeExpertiseArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      expertise_areas: prev.expertise_areas.filter((_, i) => i !== index)
    }));
  };

  const updateExpertiseArea = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      expertise_areas: prev.expertise_areas.map((area, i) => i === index ? value : area)
    }));
  };

  const getStylePreview = () => {
    const style = conversationStyles.find(s => s.value === formData.conversation_style);
    if (!style) return '';
    
    const previews = {
      friendly: "This is really interesting! I love how it connects to broader themes.",
      professional: "This presents a compelling argument with solid reasoning.",
      casual: "Cool take on this! Really makes you think differently about it.",
      philosophical: "This touches on deeper questions about meaning and purpose.",
      humorous: "Well, this is either brilliant or completely bonkers. I'm leaning toward brilliant! 😄"
    };
    
    return previews[formData.conversation_style];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Bot Personality</h2>
              <p className="text-gray-400">Design your own AI conversation partner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close bot creator"
            title="Close bot creator"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bot Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="e.g., Sage, Spark, Analyst"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Describe your bot's personality, purpose, and what makes them unique..."
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Conversation Style */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Conversation Style *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {conversationStyles.map((style) => (
                <div
                  key={style.value}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all
                    ${formData.conversation_style === style.value
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800'
                    }
                  `}
                  onClick={() => setFormData(prev => ({ ...prev, conversation_style: style.value }))}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{style.icon}</div>
                    <div>
                      <div className="font-medium text-white">{style.label}</div>
                      <div className="text-sm text-gray-400">{style.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Style Preview */}
          {formData.conversation_style && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Style Preview</span>
              </div>
              <p className="text-gray-200 italic">&quot;{getStylePreview()}&quot;</p>
            </div>
          )}

          {/* Expertise Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Expertise Areas *
            </label>
            <div className="space-y-2">
              {formData.expertise_areas.map((area, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => updateExpertiseArea(index, e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., philosophy, technology, art, science..."
                  />
                  {formData.expertise_areas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExpertiseArea(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      aria-label={`Remove expertise area ${index + 1}`}
                      title={`Remove expertise area ${index + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addExpertiseArea}
                className="flex items-center gap-2 px-3 py-2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Add Expertise Area
              </button>
            </div>
            {errors.expertise_areas && <p className="text-red-400 text-sm mt-1">{errors.expertise_areas}</p>}
          </div>

          {/* Response Length */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Response Length *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {responseLengths.map((length) => (
                <div
                  key={length.value}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all text-center
                    ${formData.response_length === length.value
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800'
                    }
                  `}
                  onClick={() => setFormData(prev => ({ ...prev, response_length: length.value }))}
                >
                  <div className="font-medium text-white">{length.label}</div>
                  <div className="text-sm text-gray-400">{length.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Avatar URL (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Avatar URL (Optional)
            </label>
            <input
              type="url"
              value={formData.avatar_url}
              onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Bot
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
