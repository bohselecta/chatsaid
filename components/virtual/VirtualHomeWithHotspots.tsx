"use client";

import React, { useState } from "react";
import VirtualHomeLayered, { type VirtualHomeItem } from "@/components/virtual/VirtualHomeLayered";
import { DeskHotspots } from "@/components/virtual/DeskHotspots";
import { BaristaPanel } from "@/components/assistant/BaristaPanel";
import { useAssistantLauncher } from "@/components/assistant/useAssistantLauncher";
import { useRouter } from "next/navigation";
import CherryWriterModal, { type AssistantMessage, type WriterCategory } from "@/components/assistant/CherryWriterModal";
import { DraftProvider, useDraft } from "@/lib/assistant/draft";

type Props = {
  backgroundUrl: string;
  deskUrl: string;
  items?: VirtualHomeItem[];
  editable?: boolean;
  onChange?: (items: VirtualHomeItem[]) => void;
};

export default function VirtualHomeWithHotspots({ backgroundUrl, deskUrl, items = [], editable, onChange }: Props) {
  const [showBarista, setShowBarista] = useState(false);
  const [showWriter, setShowWriter] = useState(false);
  const assistant = useAssistantLauncher();
  const router = useRouter();

  return (
    <DraftProvider>
      <VirtualHomeLayered backgroundUrl={backgroundUrl} deskUrl={deskUrl} items={items} editable={editable} onChange={onChange}>
        <DeskHotspots
          onAction={(id) => {
            if (id === "coffee") setShowBarista(true);
            if (id === "book") setShowWriter(true);
            if (id === "avatar") assistant.setOpen(true);
            if (id === "cherry") router.push("/mindmap?mode=cherry-board");
          }}
        />
      </VirtualHomeLayered>

      {showBarista && (
        <div className="fixed top-20 right-4 z-40" role="dialog" aria-label="Coffee Barista">
          <BaristaPanel onClose={() => setShowBarista(false)} />
        </div>
      )}

      {showWriter && (
        <CherryWriterWired
          open={showWriter}
          onClose={() => setShowWriter(false)}
        />
      )}
    </DraftProvider>
  );
}

function CherryWriterWired({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions } = useDraft();

  async function onSave(draft: { title: string; body: string; category: WriterCategory | null }) {
    actions.setTitle(draft.title);
    actions.setBody(draft.body);
    if (draft.category) actions.setTags([draft.category]);
  }

  async function onPublish(draft: { title: string; body: string; category: WriterCategory | null }) {
    actions.setTitle(draft.title);
    actions.setBody(draft.body);
    if (draft.category) actions.setTags([draft.category]);
    await actions.publish();
    onClose();
  }

  async function onAssistantSend(text: string): Promise<AssistantMessage> {
    // Simple local echo; replace with your assistant call if desired
    const reply: AssistantMessage = { id: `a_${Date.now()}`, role: 'assistant', content: `Got it: ${text}` };
    return reply;
  }

  return (
    <CherryWriterModal
      open={open}
      onClose={onClose}
      onSave={onSave}
      onPublish={onPublish}
      onAssistantSend={onAssistantSend}
      initialTitle={state.title}
      initialBody={state.body}
      initialCategory={null}
      assistantMessages={[]}
    />
  );
}
