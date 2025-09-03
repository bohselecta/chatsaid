"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppWindow, Search, X } from "lucide-react";

export type VibeApp = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  provider: "remote-url" | "npm-embed";
};

export function VibePicker({
  open,
  onOpenChange,
  presetQuery = "",
  onSelect,
  triggerButton = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  presetQuery?: string;
  onSelect: (app: VibeApp, props: any) => void;
  triggerButton?: boolean;
}) {
  const [apps, setApps] = useState<VibeApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(presetQuery);
  const [selected, setSelected] = useState<VibeApp | null>(null);
  const [propsJson, setPropsJson] = useState<string>("{}");

  useEffect(() => {
    setQuery(presetQuery || "");
  }, [presetQuery]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/vibes")
      .then((r) => r.json())
      .then((data) => setApps(((data?.apps as VibeApp[]) || [])))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return apps;
    return apps.filter(
      (a) => a.name.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q)
    );
  }, [apps, query]);

  function handleConfirm() {
    try {
      const props = JSON.parse(propsJson || "{}");
      if (selected) onSelect(selected, props);
    } catch {
      alert("Invalid JSON in props");
    }
  }

  return (
    <>
      {triggerButton && (
        <button
          onClick={() => onOpenChange(true)}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white hover:bg-white/10"
        >
          <AppWindow className="h-4 w-4" /> Pick Vibe
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[120]">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => onOpenChange(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative mx-auto mt-16 w-full max-w-lg rounded-xl border border-white/10 bg-gray-900 p-4 text-white shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Search className="h-4 w-4" /> Select a Vibe App
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-md p-1.5 text-white/80 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                placeholder="Search vibes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-rose-400/40"
              />

              <div className="max-h-60 overflow-y-auto rounded border border-white/10">
                {loading && (
                  <div className="p-3 text-sm text-white/60">Loading…</div>
                )}
                {!loading && filtered.length === 0 && (
                  <div className="p-3 text-sm text-white/60">No matches</div>
                )}
                {!loading &&
                  filtered.map((app) => (
                    <div
                      key={app.id}
                      data-testid={`vibe-item-${app.slug}`}
                      onClick={() => setSelected(app)}
                      className={`cursor-pointer border-b border-white/5 p-2 text-sm hover:bg-white/10 ${
                        selected?.id === app.id ? "bg-white/10" : ""
                      }`}
                    >
                      <div className="font-medium text-white/90">{app.name}</div>
                      <div className="text-xs text-white/60">
                        {app.slug} · {app.provider}
                      </div>
                      {app.description && (
                        <div className="line-clamp-2 text-xs text-white/50">
                          {app.description}
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {selected && (
                <div className="space-y-2">
                  <label htmlFor="props" className="text-xs text-white/70">
                    Props (JSON)
                  </label>
                  <input
                    id="props"
                    value={propsJson}
                    onChange={(e) => setPropsJson(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-rose-400/40"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-md px-2 py-1.5 text-sm text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selected}
                  className="rounded-md bg-rose-500 px-2 py-1.5 text-sm text-white hover:bg-rose-500/90 disabled:opacity-50"
                >
                  Attach
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
