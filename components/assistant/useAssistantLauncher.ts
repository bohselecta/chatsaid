"use client";

import { useState } from "react";
import { useBot } from "@/components/bot/BotProvider";

export function useAssistantLauncher() {
  try {
    const { isOpen, openBot, closeBot } = useBot();
    return {
      open: isOpen,
      setOpen: (v: boolean) => (v ? openBot() : closeBot()),
    };
  } catch {
    // Fallback if BotProvider is not mounted in tree
    const [open, setOpen] = useState(false);
    return { open, setOpen };
  }
}

