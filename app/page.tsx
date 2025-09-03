"use client";

import Hero from "@/components/landing/Hero";
import AssistantBubble from "@/components/landing/AssistantBubble";
import { Tiles } from "@/components/landing/Tiles";

export default function Page() {
  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-black text-white px-2 py-1 rounded"
      >
        Skip to content
      </a>

      <header aria-label="Site header">
        <Hero />
        <AssistantBubble />
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 py-8" aria-label="Main content">
        <Tiles />
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-black/60 dark:text-white/60">
        © {new Date().getFullYear()} ChatSaid
      </footer>
    </>
  );
}
