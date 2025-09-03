"use client";

import { create } from "zustand";

type WriterState = {
  open: boolean;
  seedTitle?: string;
  seedBody?: string;
  lastFocus?: HTMLElement | null;
  openWriter: (opts?: { title?: string; body?: string }) => void;
  closeWriter: () => void;
};

export const useWriter = create<WriterState>((set, get) => ({
  open: false,
  seedTitle: "",
  seedBody: "",
  lastFocus: null,
  openWriter: (opts) => {
    if (get().open) return; // idempotent open
    set({
      open: true,
      seedTitle: opts?.title ?? "",
      seedBody: opts?.body ?? "",
      lastFocus: typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null,
    });
  },
  closeWriter: () => set({ open: false, seedTitle: "", seedBody: "" }),
}));
