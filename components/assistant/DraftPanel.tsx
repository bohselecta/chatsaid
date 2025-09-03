"use client";

import React from "react";
import { useDraft } from "@/lib/assistant/draft";
import { Plus, X, Send, Image as ImageIcon, AppWindow } from "lucide-react";

export function DraftPanel() {
  const { state, actions } = useDraft();
  const tagInputRef = React.useRef<HTMLInputElement>(null);

  function addTagFromInput() {
    const v = tagInputRef.current?.value?.trim();
    if (!v) return;
    actions.setTags(Array.from(new Set([...(state.tags || []), v])));
    if (tagInputRef.current) tagInputRef.current.value = "";
  }

  return (
    <div data-testid="draft-panel" className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/90">Draft</h3>
        <div className="flex items-center gap-2">
          <button onClick={actions.reset} className="rounded-md p-1.5 text-white/80 hover:bg-white/10" title="Reset draft">
            <X className="h-4 w-4" />
          </button>
          <button onClick={actions.publish} className="inline-flex items-center gap-2 rounded-md bg-rose-500 px-2 py-1.5 text-sm text-white hover:bg-rose-500/90" title="Publish">
            <Send className="h-4 w-4" /> Publish
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <input
          placeholder="Title"
          value={state.title}
          onChange={(e) => actions.setTitle(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-rose-400/40"
        />
        <textarea
          placeholder="Write a concise cherry…"
          value={state.body}
          onChange={(e) => actions.setBody(e.target.value)}
          className="min-h-[100px] w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-rose-400/40"
        />

        <div>
          <div className="mb-1 text-xs text-white/60">Tags</div>
          <div className="flex items-center gap-2">
            <input
              ref={tagInputRef}
              placeholder="Add tag"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addTagFromInput(); }
              }}
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-rose-400/40"
            />
            <button onClick={addTagFromInput} className="rounded-md border border-white/10 bg-white/5 p-1.5 text-white hover:bg-white/10" title="Add tag">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {state.tags.map((t) => (
              <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/90">{t}</span>
            ))}
          </div>
        </div>

        {state.media.length > 0 && (
          <div>
            <div className="mb-1 text-xs text-white/60">Media</div>
            <ul className="space-y-2">
              {state.media.map((m, i) => (
                <li key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-white/10">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white/90">{m.caption || m.alt || m.mime}</div>
                    <div className="truncate text-xs text-white/60">{m.ai?.model ? `AI: ${m.ai.model}` : m.mime}</div>
                  </div>
                  <button onClick={() => actions.removeMedia(i)} className="rounded-md p-1.5 text-white/80 hover:bg-white/10" title="Remove">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {state.vibe && (
          <div data-testid="draft-vibe" className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-white/90"><AppWindow className="h-4 w-4" />Vibe App</div>
            <div className="text-xs text-white/70">{state.vibe.appName || state.vibe.appSlug}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DraftPanel;
