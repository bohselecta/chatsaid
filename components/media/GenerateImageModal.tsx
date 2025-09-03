"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, ShieldCheck, Wand2 } from "lucide-react";

type Size = "1024" | "1536";

type GenerateImageModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotaUsed: number;
  quotaMax: number;
  onGenerated?: (mediaIds: string[]) => void;
};

export default function GenerateImageModal({ open, onOpenChange, quotaUsed, quotaMax, onGenerated }: GenerateImageModalProps) {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<Size>("1024");
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPrompt("");
      setSize("1024");
      setSeed(undefined);
      setCount(1);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const disabled = useMemo(() => loading || !prompt.trim() || quotaUsed >= quotaMax, [loading, prompt, quotaUsed, quotaMax]);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/gen/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, n: count, size }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || res.statusText;
        setError(typeof msg === "string" ? msg : "Generation failed");
        setLoading(false);
        return;
      }
      const ids: string[] = Array.isArray(data?.media_ids) ? data.media_ids : [];
      onGenerated?.(ids);
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => onOpenChange(false)} aria-hidden></div>
      <div role="dialog" aria-modal="true" className="relative w-full max-w-lg rounded-xl border border-white/10 bg-gray-900 p-4 shadow-xl">
        <div className="mb-3 flex items-center gap-2 text-white">
          <Wand2 className="h-5 w-5" aria-hidden />
          <h2 className="text-lg font-semibold">Generate with AI</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="prompt" className="mb-1 block text-sm text-white/80">Prompt</label>
            <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="h-28 w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-rose-400/40" placeholder="A cherry blossom tree made of glass, soft dawn light…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="size" className="block text-sm text-white/80">Size</label>
              <select id="size" value={size} onChange={(e) => setSize(e.target.value as Size)} className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-2 text-sm text-white">
                <option value="1024">Square · 1024</option>
                <option value="1536">Large · 1536</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="count" className="block text-sm text-white/80">Count</label>
              <input id="count" type="number" min={1} max={4} value={count} onChange={(e) => setCount(Math.max(1, Math.min(4, Number(e.target.value) || 1)))} className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-2 text-sm text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="seed" className="block text-sm text-white/80">Seed (optional)</label>
              <input id="seed" inputMode="numeric" placeholder="random" value={seed ?? ""} onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)} className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-2 text-sm text-white" />
            </div>
            <QuotaMeter used={quotaUsed} max={quotaMax} />
          </div>

          {error && <div className="rounded-md border border-rose-400/30 bg-rose-400/10 p-2 text-sm text-rose-200">{error}</div>}

          <div className="flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Safe use: no disallowed content; images are moderated.</div>
            <div className="flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Credits reset daily.</div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={() => onOpenChange(false)} className="rounded-md px-3 py-2 text-sm text-white hover:bg-white/5">Cancel</button>
            <button onClick={generate} disabled={disabled} className="inline-flex items-center gap-2 rounded-md bg-rose-500 px-3 py-2 text-sm text-white hover:bg-rose-500/90 disabled:opacity-50">
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Generating…</>) : (<>Generate</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuotaMeter({ used, max }: { used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, max)) * 100));
  const remain = Math.max(0, max - used);
  return (
    <div className="space-y-1">
      <label className="block text-sm text-white/80">Daily credits</label>
      <div className="h-2 w-full rounded bg-white/10">
        <div className="h-2 rounded bg-rose-400" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right text-xs text-white/70">{remain} / {max}</div>
    </div>
  );
}

