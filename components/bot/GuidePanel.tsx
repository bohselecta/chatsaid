"use client";

import { useState } from "react";
import { useWriter } from "@/lib/ui/useWriter";
import { track } from "@/lib/analytics/events";

export default function GuidePanel() {
  const [busy, setBusy] = useState(false);

  async function outlineHelp() {
    setBusy(true);
    try {
      // Placeholder action – wire to your assistant route if desired
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setBusy(false);
    }
  }

  const startQuickDraft = () => {
    useWriter.getState().openWriter({ title: "Quick outline", body: "Topic: " });
  };

  return (
    <aside className="sticky top-24 hidden h-max w-[320px] shrink-0 rounded-xl border border-white/10 bg-white/[.04] p-4 text-white md:block">
      <div className="mb-2 text-sm font-semibold">Create with ChatSaid</div>
      <p className="text-sm text-white/80">
        I can help you draft, polish, or add media — step by step.
      </p>
      <button
        aria-label="Start a quick draft in writer"
        onClick={() => { track("guidepanel_click", { source: "canopy" }); startQuickDraft(); void outlineHelp(); }}
        disabled={busy}
        className="mt-3 w-full rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? "Working…" : "Start a quick draft"}
      </button>
    </aside>
  );
}
