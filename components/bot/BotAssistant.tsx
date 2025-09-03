'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useBotReports } from '@/lib/hooks/useBotReports';
import { useBotSettings } from '@/lib/hooks/useBotSettings';
import { useDraft } from '@/lib/assistant/draft';
import { genImage } from '@/lib/assistant/skills/genImage';
import { summarizeToCherry } from '@/lib/assistant/skills/summarizeToCherry';
import { runDigest } from '@/lib/assistant/skills/runDigest';
import { altCaption } from '@/lib/assistant/skills/altCaption';
import { DraftPanel } from '@/components/assistant/DraftPanel';
import { VibePicker, type VibeApp } from '@/components/vibes/VibePicker';
import { supabase } from '@/lib/supabaseClient';
import { convertSocialPost } from '@/lib/assistant/skills/convertSocialPost';

interface BotAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

type Message = { id: string; role: 'user' | 'bot' | 'system'; text: string; at: Date };
type SkillKey = 'genImage' | 'summarize' | 'runDigest' | 'altCaption' | 'attachVibe' | 'reviewImports' | 'convertLatest';
type ActionCard = {
  id: string;
  title: string;
  desc: string;
  skill: SkillKey;
  params: any;
  status: 'pending' | 'running' | 'done' | 'error';
  error?: string;
};

export default function BotAssistant({ isOpen, onClose, className = '' }: BotAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { reports, unreadCount, markAsSeen } = useBotReports();
  const { settings } = useBotSettings();
  const { state: draft, actions } = useDraft();
  const [showVibePicker, setShowVibePicker] = useState(false);
  const [pendingVibeQuery, setPendingVibeQuery] = useState('');

  const [cards, setCards] = useState<ActionCard[]>(() => [
    { id: 'c1', title: 'Generate image', desc: 'Create an AI image from a prompt', skill: 'genImage', params: { prompt: 'A playful cherry made of glass' }, status: 'pending' },
    { id: 'c2', title: 'Summarize link', desc: 'Turn a URL into a draft cherry', skill: 'summarize', params: { url: 'https://example.com/article' }, status: 'pending' },
    { id: 'c3', title: 'Improve alt/caption', desc: 'Suggest better alt and caption for last media', skill: 'altCaption', params: { target: 'last-media' }, status: 'pending' },
    { id: 'c4', title: 'Run digest', desc: 'Scan watchlists and suggest highlights', skill: 'runDigest', params: { scope: 'default' }, status: 'pending' },
    { id: 'c5', title: 'Attach vibe (draft)', desc: 'Attach a Vibe app to draft (stored locally until publish)', skill: 'attachVibe', params: { appSlug: 'mind-map', appName: 'Mind Map', props: { density: 0.8 } }, status: 'pending' },
    { id: 'c6', title: 'Review imports', desc: 'Open Inbox to review new social imports', skill: 'reviewImports', params: {}, status: 'pending' },
    { id: 'c7', title: 'Convert latest 3', desc: 'Build drafts from your newest imports', skill: 'convertLatest', params: { count: 3 }, status: 'pending' },
  ]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ id: 'welcome', role: 'bot', text: `Hi! I have ${unreadCount} new suggestion${unreadCount === 1 ? '' : 's'}.`, at: new Date() }]);
    }
  }, [isOpen, unreadCount]);

  useEffect(() => { if (isOpen && unreadCount > 0) markAsSeen(); }, [isOpen, unreadCount, markAsSeen]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const confirm = async (cardId: string) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: 'running', error: undefined } : c));
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    try {
      switch (card.skill) {
        case 'genImage': {
          const { prompt } = card.params as { prompt: string };
          const res = await genImage(prompt);
          const ids = res.media_ids || [];
          if (ids.length > 0) {
            try {
              const enriched = await fetch('/api/media/by-ids', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }).then(r => r.json());
              const mapped = (enriched?.media || []).map((m: any) => ({
                id: m.id as string,
                mime: m.mime as string,
                url: m.public_url as string | undefined,
                width: m.width as number | undefined,
                height: m.height as number | undefined,
                alt: (m.alt_text as string) || '',
                caption: (m.caption as string) || '',
                ai: { model: m.ai_model as string | undefined, prompt: m.ai_prompt as string | undefined },
              }));
              actions.addMedia(mapped);
            } catch {
              // Fallback to minimal mapping if enrichment fails
              actions.addMedia(ids.map((id: string) => ({ id, mime: 'image/webp', alt: `AI image for ${prompt}`, caption: '' })));
            }
          }
          break;
        }
        case 'summarize': {
          const { url } = card.params as { url: string };
          const s = await summarizeToCherry(url);
          actions.setTitle(s.title);
          actions.setBody(s.body);
          actions.setTags(s.tags || []);
          break;
        }
        case 'runDigest': {
          const { scope } = card.params as { scope: string };
          const d = await runDigest(scope);
          setMessages(m => [...m, { id: `dg_${Date.now()}`, role: 'system', text: `Digest ready with ${d?.digest?.highlights?.length ?? 0} highlights.`, at: new Date() }]);
          break;
        }
        case 'reviewImports': {
          setMessages(ms => [...ms, { id: `ri_${Date.now()}`, role: 'system', text: 'Opening Review Inbox…', at: new Date() }]);
          try { window.location.assign('/inbox'); } catch {}
          break;
        }
        case 'convertLatest': {
          const count = Math.max(1, Math.min(5, (card.params?.count ?? 3)));
          const { data: { user } } = await supabase.auth.getUser();
          if (!user?.id) throw new Error('Not signed in');
          const res = await fetch(`/api/social/posts?status=new&userId=${encodeURIComponent(user.id)}`);
          if (!res.ok) throw new Error('No imports available');
          const js = await res.json();
          const posts: any[] = js.posts || [];
          const pick = posts.slice(0, count);
          let c = 0;
          for (const p of pick) {
            try {
              const out = await convertSocialPost(p.id);
              if (c === 0 && out?.draft) {
                window.dispatchEvent(new CustomEvent('draft:open', { detail: out.draft }));
              }
              c++;
            } catch (e) {
              // continue
            }
          }
          setMessages(ms => [...ms, { id: `cl_${Date.now()}`, role: 'system', text: `Prepared ${c} draft${c===1?'':'s'} from imports.`, at: new Date() }]);
          break;
        }
        case 'altCaption': {
          const lastIdx = draft.media.length - 1;
          if (lastIdx >= 0) {
            const last = draft.media[lastIdx];
            const target = typeof last.id === 'string' ? last.id : 'draft-media';
            const r = await altCaption(target);
            const updated = { ...last, alt: r.alt, caption: r.caption ?? last.caption };
            actions.removeMedia(lastIdx);
            actions.addMedia([updated]);
          } else {
            setMessages(m => [...m, { id: `warn_${Date.now()}`, role: 'system', text: 'No media in draft to improve.', at: new Date() }]);
          }
          break;
        }
        case 'attachVibe': {
          const { appSlug, appName, props } = card.params as { appSlug?: string; appName?: string; props?: any };
          actions.setVibe({ appSlug, appName, props });
          break;
        }
      }
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: 'done' } : c));
    } catch (e: any) {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: 'error', error: e?.message || 'Action failed' } : c));
    }
  };

  const dismiss = (cardId: string) => setCards(prev => prev.filter(c => c.id !== cardId));

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setMessages(m => [...m, { id: `${Date.now()}`, role: 'user', text, at: new Date() }]);
    setInputValue('');
    setIsTyping(true);
    const m = /attach\s+vibe\s+(.+)/i.exec(text);
    if (m && m[1]) {
      setPendingVibeQuery(m[1].trim());
      setShowVibePicker(true);
    }
    (async () => {
      try {
        const intent = routeIntent(text);
        if (intent.intent === 'REVIEW_IMPORTS') {
          setMessages(ms => [...ms, { id: `ri_${Date.now()}`, role: 'system', text: 'Opening Review Inbox…', at: new Date() }]);
          window.location.assign('/inbox');
          return;
        }
        if (intent.intent === 'CONVERT_LATEST') {
          const count = Math.max(1, Math.min(5, (intent as any).count ?? 3));
          const { data: { user } } = await supabase.auth.getUser();
          if (!user?.id) throw new Error('Not signed in');
          const res = await fetch(`/api/social/posts?status=new&userId=${encodeURIComponent(user.id)}`);
          if (!res.ok) throw new Error('No imports available');
          const js = await res.json();
          const posts: any[] = js.posts || [];
          const pick = posts.slice(0, count);
          let c = 0;
          for (const p of pick) {
            try {
              const out = await convertSocialPost(p.id);
              if (c === 0 && out?.draft) {
                window.dispatchEvent(new CustomEvent('draft:open', { detail: out.draft }));
              }
              c++;
            } catch {}
          }
          setMessages(ms => [...ms, { id: `cl_${Date.now()}`, role: 'system', text: `Prepared ${c} draft${c===1?'':'s'} from imports.`, at: new Date() }]);
          return;
        }
      } catch {}
    })().finally(() => setIsTyping(false));
    setTimeout(() => { setMessages(ms => [...ms, { id: `${Date.now()}b`, role: 'bot', text: 'Got it — try a suggested action above or ask for one.', at: new Date() }]); setIsTyping(false); }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-20 right-4 z-40 w-[380px] max-h-[80vh] bg-[#1f1f1f] border border-gray-700 rounded-xl shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-[#242424]">
        <div className="text-sm font-medium">Assistant</div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10" title="Close"><X className="w-4 h-4" /></button>
      </div>

      {/* Confirm → Execute Cards */}
      <div className="max-h-32 overflow-y-auto border-b border-gray-800 p-2 space-y-2 bg-[#242424]">
        {cards.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
            <div className="min-w-0">
              <div className="text-xs font-medium text-white/90 truncate">{c.title}</div>
              <div className="text-[11px] text-white/60 truncate">{c.desc}</div>
            </div>
            <div className="flex items-center gap-1">
              {c.status === 'running' && <span className="text-[10px] text-amber-300">Running…</span>}
              {c.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              {c.status === 'error' && (
                <span title={c.error}>
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </span>
              )}
              {c.status === 'pending' && (
                <>
                  {c.skill === 'attachVibe' && (
                    <button
                      data-testid="pick-vibe-btn"
                      onClick={() => { setPendingVibeQuery(c.params?.appSlug || c.params?.appName || ''); setShowVibePicker(true); }}
                      className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                    >
                      Pick Vibe
                    </button>
                  )}
                  <button onClick={() => confirm(c.id)} className="text-xs px-2 py-1 rounded bg-rose-500 hover:bg-rose-500/90">Confirm</button>
                  <button onClick={() => dismiss(c.id)} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20">Dismiss</button>
                </>
              )}
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="text-[11px] text-white/60">No suggestions. Ask me to do something!</div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[38vh]">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${m.role === 'user' ? 'bg-cherry-500 text-white' : m.role === 'system' ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-gray-200'}`}>{m.text}</div>
          </div>
        ))}
        {isTyping && <div className="text-[11px] text-white/60">Assistant is typing…</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700">
        <form onSubmit={send} className="flex gap-2">
          <input data-testid="assistant-input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask me anything…" className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm" />
          <button type="submit" disabled={!inputValue.trim()} className="px-3 py-2 bg-cherry-500 rounded text-white disabled:opacity-60"><Send className="w-4 h-4" /></button>
        </form>
      </div>

      {/* Draft Panel */}
      <div className="border-t border-gray-800 bg-[#1e1e1e] p-2">
        <DraftPanel />
      </div>

      {/* Vibe Picker Modal */}
      <VibePicker
        open={showVibePicker}
        onOpenChange={(v) => setShowVibePicker(v)}
        presetQuery={pendingVibeQuery}
        onSelect={(app: VibeApp, props: any) => {
          actions.setVibe({ appSlug: app.slug, appName: app.name, props, aspect: 0.5625 });
          setShowVibePicker(false);
          setPendingVibeQuery('');
          setMessages(ms => [...ms, { id: `v_${Date.now()}`, role: 'system', text: `Attached vibe: ${app.name}`, at: new Date() }]);
        }}
      />
    </div>
  );
}
