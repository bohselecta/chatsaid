"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useWriter } from "@/lib/ui/useWriter";
import { track } from "@/lib/analytics/events";

const TEMPLATES = [
  { id: "quick", title: "Quick post", body: "What I’m thinking about today:\n\n- " },
  { id: "announce", title: "Announcement", body: "🚀 Announcement:\n\nToday we’re...\n\nDetails:\n- " },
  { id: "question", title: "Question", body: "I’m curious about...\n\nDoes anyone have experience with..." },
  { id: "thread", title: "Thread intro", body: "🧵 Thread: \n\n1) \n2) \n3) " },
];

export default function CreatePage() {
  const params = useSearchParams();
  const open = useWriter.getState().openWriter;

  useEffect(() => {
    const t = params.get("title") ?? "";
    const b = params.get("body") ?? "";
    const auto = params.get("auto");
    if (auto || t || b) {
      track("writer_open", { source: "deep_link" });
      open({ title: t, body: b });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-3">Start writing</h1>
      <p className="text-black/70 dark:text-white/70 mb-6">Pick a template or start from scratch. You can always change it later.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            className="rounded-xl border border-black/10 bg-white p-4 text-left shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-black/50"
            aria-label={`Use template: ${t.title}`}
            onClick={() => {
              track("writer_template_insert", { templateId: t.id });
              open({ title: t.title, body: t.body });
            }}
          >
            <div className="text-lg font-semibold">{t.title}</div>
            <div className="text-sm text-black/70 line-clamp-3 whitespace-pre-wrap">{t.body}</div>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <button
          className="rounded-md border border-black/10 px-3 py-2 hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-black/50"
          onClick={() => open()}
          aria-label="Start from scratch"
        >
          Start from scratch
        </button>
      </div>
    </main>
  );
}
