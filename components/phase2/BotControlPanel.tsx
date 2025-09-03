'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Bot, 
  Bell, 
  Clock, 
  Users, 
  Zap, 
  Shield, 
  Info,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import CherryOverlay from './CherryOverlay';

interface AutonomyFlags {
  pingsAllowed: boolean;
  autoAck: boolean;
  dailyTokenBudget: number;
  quietHours: [number, number];
  trustedPersonas: string[];
  autoLearnTags: 'never' | 'ask' | 'auto-after-3-pins';
}

interface Persona {
  id: string;
  display_name: string;
  avatar_url?: string;
  description?: string;
  autonomy_flags: AutonomyFlags;
  last_active: string;
}

interface BotControlPanelProps {
  userId: string;
  className?: string;
}

export default function BotControlPanel({ userId, className = '' }: BotControlPanelProps) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCherryOverlay, setShowCherryOverlay] = useState(false);
  const [settings, setSettings] = useState<AutonomyFlags>({
    pingsAllowed: true,
    autoAck: false,
    dailyTokenBudget: 1000,
    quietHours: [22, 8],
    trustedPersonas: [],
    autoLearnTags: 'ask'
  });

  useEffect(() => {
    loadPersona();
  }, [userId]);

  const loadPersona = async () => {
    try {
      const response = await fetch('/api/persona/settings');
      if (response.ok) {
        const { persona } = await response.json();
        setPersona(persona);
        if (persona?.autonomy_flags) {
          setSettings(persona.autonomy_flags);
        }
      }
    } catch (error) {
      console.error('Failed to load persona:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/persona/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          autonomyFlags: settings
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        // Reload persona to get updated data
        await loadPersona();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof AutonomyFlags>(key: K, value: AutonomyFlags[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cherry-500 to-cherry-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Bot Control Panel
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure your AI companion's behavior and autonomy
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Settings */}
      <div className="p-6 space-y-6">
        {/* Communication Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Bell className="w-5 h-5 text-cherry-500" />
            <span>Communication</span>
          </h3>
          
          <div className="space-y-4">
            <SettingToggle
              title="Allow Pings"
              description="Let other personas send you ping requests for summaries"
              value={settings.pingsAllowed}
              onChange={(value) => updateSetting('pingsAllowed', value)}
              icon={<Zap className="w-4 h-4" />}
            />
            
            <SettingToggle
              title="Auto-Acknowledge"
              description="Automatically respond to pings with basic acknowledgment"
              value={settings.autoAck}
              onChange={(value) => updateSetting('autoAck', value)}
              icon={<CheckCircle className="w-4 h-4" />}
              disabled={!settings.pingsAllowed}
            />
          </div>
        </div>

        {/* Resource Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-cherry-500" />
            <span>Resource Management</span>
          </h3>
          
          <div className="space-y-4">
            <SettingSlider
              title="Daily Token Budget"
              description="Maximum tokens your bot can use per day for AI operations"
              value={settings.dailyTokenBudget}
              onChange={(value) => updateSetting('dailyTokenBudget', value)}
              min={100}
              max={5000}
              step={100}
              unit="tokens"
            />
            
            <SettingTimeRange
              title="Quiet Hours"
              description="Hours when your bot should minimize activity"
              value={settings.quietHours}
              onChange={(value) => updateSetting('quietHours', value)}
            />
          </div>
        </div>

        {/* Learning & Trust */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cherry-500" />
            <span>Learning & Trust</span>
          </h3>
          
          <div className="space-y-4">
            <SettingSelect
              title="Auto-Learn Tags"
              description="How your bot should learn new tags from your interactions"
              value={settings.autoLearnTags}
              onChange={(value) => updateSetting('autoLearnTags', value)}
              options={[
                { value: 'never', label: 'Never auto-learn' },
                { value: 'ask', label: 'Ask before learning' },
                { value: 'auto-after-3-pins', label: 'Auto-learn after 3 pins' }
              ]}
            />
          </div>
        </div>

        {/* Cherry Generation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cherry-500" />
            <span>Cherry Generation</span>
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-cherry-50 to-cherry-100 dark:from-cherry-900 dark:to-cherry-800 rounded-lg border border-cherry-200 dark:border-cherry-700">
              <h4 className="font-medium text-cherry-800 dark:text-cherry-200 mb-2">
                Generate Personalized Cherries
              </h4>
              <p className="text-sm text-cherry-600 dark:text-cherry-300 mb-3">
                Create cherry suggestions based on your prompts, mood, and style preferences. Your bot acts as a personal algorithm, filtering and generating content that matches your intent.
              </p>
              <button
                onClick={() => setShowCherryOverlay(true)}
                className="w-full py-2 px-4 bg-cherry-500 text-white rounded-lg hover:bg-cherry-600 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Cherry Generator</span>
              </button>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>• Cherries are generated based on your watchlist and preferences</p>
              <p>• Nothing posts automatically - you control what gets shared</p>
              <p>• Each cherry includes provenance and confidence scores</p>
            </div>
          </div>
        </div>

        {/* Trusted Personas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Users className="w-5 h-5 text-cherry-500" />
            <span>Trusted Personas</span>
          </h3>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Personas your bot trusts more and gives higher affinity scores to
            </p>
            <div className="flex flex-wrap gap-2">
              {settings.trustedPersonas.map((personaId, index) => (
                <span
                  key={personaId}
                  className="px-3 py-1 bg-cherry-100 dark:bg-cherry-900 text-cherry-800 dark:text-cherry-200 rounded-full text-sm"
                >
                  Persona {index + 1}
                  <button
                    onClick={() => {
                      const newTrusted = settings.trustedPersonas.filter(id => id !== personaId);
                      updateSetting('trustedPersonas', newTrusted);
                    }}
                    className="ml-2 text-cherry-600 dark:text-cherry-400 hover:text-cherry-800 dark:hover:text-cherry-200"
                  >
                    ×
                  </button>
                </span>
              ))}
              {settings.trustedPersonas.length === 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No trusted personas yet
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4 inline mr-1" />
            Changes take effect immediately
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              saving
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-cherry-500 text-white hover:bg-cherry-600'
            }`}
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Cherry Overlay */}
      <CherryOverlay
        isOpen={showCherryOverlay}
        onClose={() => setShowCherryOverlay(false)}
        userId={userId}
      />
    </div>
  );
}

interface SettingToggleProps {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon: React.ReactNode;
  disabled?: boolean;
}

function SettingToggle({ title, description, value, onChange, icon, disabled = false }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="text-cherry-500">{icon}</div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        disabled={disabled}
        title={`Toggle ${title}`}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          disabled 
            ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
            : value 
              ? 'bg-cherry-500' 
              : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

interface SettingSliderProps {
  title: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}

function SettingSlider({ title, description, value, onChange, min, max, step, unit }: SettingSliderProps) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">{title}</h4>
        <span className="text-sm text-cherry-600 dark:text-cherry-400 font-medium">
          {value} {unit}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        title={`${title} slider`}
        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

interface SettingTimeRangeProps {
  title: string;
  description: string;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

function SettingTimeRange({ title, description, value, onChange }: SettingTimeRangeProps) {
  const [start, end] = value;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
      <div className="flex items-center space-x-4">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start</label>
          <select
            value={start}
            onChange={(e) => onChange([Number(e.target.value), end])}
            title="Start time"
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{formatTime(i)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End</label>
          <select
            value={end}
            onChange={(e) => onChange([start, Number(e.target.value)])}
            title="End time"
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{formatTime(i)}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

interface SettingSelectProps {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function SettingSelect({ title, description, value, onChange, options }: SettingSelectProps) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={title}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatTime(hour: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}