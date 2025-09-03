"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useWriter } from "@/lib/ui/useWriter";
import { track } from "@/lib/analytics/events";

const CherryWriterModal = dynamic(() => import("@/components/assistant/CherryWriterModal"), {
  ssr: false,
});

export default function WriterRoot() {
  const { open, closeWriter, seedTitle, seedBody, lastFocus } = useWriter();

  useEffect(() => {
    if (open) track("writer_open", { seedTitle: !!seedTitle, seedBody: !!seedBody });
  }, [open, seedTitle, seedBody]);

  // Optional guard: prevent accidental tab close while drafting
  useEffect(() => {
    if (!open) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [open]);

  // Global hotkey: Cmd/Ctrl+J to open writer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when user is typing in inputs/contenteditable
      const t = e.target as HTMLElement | null;
      const tag = (t?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || (t as any)?.isContentEditable;
      if (isTyping) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        try {
          const { useWriter } = require('@/lib/ui/useWriter');
          // Analytics: explicit hotkey source
          try { const { track } = require('@/lib/analytics/events'); track('writer_open', { source: 'hotkey' }); } catch {}
          useWriter.getState().openWriter();
        } catch {}
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleClose = () => {
    // Restore focus to the opener if we captured it
    try {
      lastFocus?.focus?.();
    } catch {}
    closeWriter();
  };

  return open ? (
    <CherryWriterModal
      open={open}
      onClose={handleClose}
      onSave={async () => {}}
      initialTitle={seedTitle ?? ""}
      initialBody={seedBody ?? ""}
      initialCategory={null}
      assistantMessages={[]}
    />
  ) : null;
}
