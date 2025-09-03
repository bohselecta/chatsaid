"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";

export type DraftMedia = {
  id?: string;
  mime: string;
  url?: string;
  width?: number;
  height?: number;
  alt: string;
  caption?: string;
  ai?: { model?: string; prompt?: string };
};

export type DraftVibe = {
  appSlug?: string;
  appName?: string;
  props?: any;
  posterUrl?: string;
  aspect?: number;
};

export type DraftState = {
  title: string;
  body: string;
  tags: string[];
  media: DraftMedia[];
  vibe?: DraftVibe | null;
};

type Action =
  | { type: "setTitle"; value: string }
  | { type: "setBody"; value: string }
  | { type: "setTags"; value: string[] }
  | { type: "addMedia"; value: DraftMedia[] }
  | { type: "removeMedia"; index: number }
  | { type: "setVibe"; value: DraftVibe | null }
  | { type: "reset" };

function reducer(state: DraftState, action: Action): DraftState {
  switch (action.type) {
    case "setTitle":
      return { ...state, title: action.value };
    case "setBody":
      return { ...state, body: action.value };
    case "setTags":
      return { ...state, tags: action.value };
    case "addMedia":
      return { ...state, media: [...state.media, ...action.value] };
    case "removeMedia":
      return { ...state, media: state.media.filter((_, i) => i !== action.index) };
    case "setVibe":
      return { ...state, vibe: action.value };
    case "reset":
      return initialState();
    default:
      return state;
  }
}

function initialState(): DraftState {
  return { title: "", body: "", tags: [], media: [], vibe: null };
}

const DraftCtx = createContext<{
  state: DraftState;
  actions: {
    setTitle: (v: string) => void;
    setBody: (v: string) => void;
    setTags: (v: string[]) => void;
    addMedia: (arr: DraftMedia[]) => void;
    removeMedia: (index: number) => void;
    setVibe: (v: DraftVibe | null) => void;
    reset: () => void;
    publish: () => Promise<void>;
  };
} | null>(null);

export function DraftProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const actions = useMemo(() => ({
    setTitle: (v: string) => dispatch({ type: "setTitle", value: v }),
    setBody: (v: string) => dispatch({ type: "setBody", value: v }),
    setTags: (v: string[]) => dispatch({ type: "setTags", value: v }),
    addMedia: (arr: DraftMedia[]) => dispatch({ type: "addMedia", value: arr }),
    removeMedia: (index: number) => dispatch({ type: "removeMedia", index }),
    setVibe: (v: DraftVibe | null) => dispatch({ type: "setVibe", value: v }),
    reset: () => dispatch({ type: "reset" }),
    publish: async () => {
      // TODO: Replace with your real cherry create endpoint and shape
      const payload = {
        title: state.title,
        content: state.body,
        tags: state.tags,
        media: state.media,
        vibe: state.vibe,
      };
      console.log("[draft.publish]", payload);
      // Example: await fetch('/api/cherries', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      // On success, reset draft
      dispatch({ type: "reset" });
    },
  }), [state]);

  return <DraftCtx.Provider value={{ state, actions }}>{children}</DraftCtx.Provider>;
}

export function useDraft() {
  const ctx = useContext(DraftCtx);
  if (!ctx) throw new Error("useDraft must be used within DraftProvider");
  return ctx;
}

