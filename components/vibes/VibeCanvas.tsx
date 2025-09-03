"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { VibeApp } from "@/lib/types/vibes";

type Props = {
  app: VibeApp;
  initialProps?: any;
  posterUrl?: string;
  aspect?: number; // e.g., 16/9 default
  className?: string;
  fullHeight?: boolean; // when true, force the iframe to 100vh
};

const MAX_HEIGHT = 1200;

export default function VibeCanvas({ app, initialProps, posterUrl, aspect = 9 / 16, className = "", fullHeight = false }: Props) {
  const [mounted, setMounted] = useState(false);
  const [height, setHeight] = useState<number>(() => Math.round(600));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const allowedHosts = useMemo(() => (app.allowed_origins || []).map((o) => {
    try { return new URL(o).host } catch { return o }
  }), [app.allowed_origins]);

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      try {
        const host = new URL(ev.origin).host;
        if (allowedHosts.length && !allowedHosts.includes(host)) return;
      } catch { return }
      const data = ev.data || {};
      if (data.type === 'vibe:ready') {
        if (iframeRef.current?.contentWindow && ev.origin) {
          iframeRef.current.contentWindow.postMessage({ type: 'vibe:init', props: initialProps || {} }, ev.origin);
        }
      }
      if (data.type === 'vibe:resize' && typeof data.height === 'number') {
        setHeight(Math.min(MAX_HEIGHT, Math.max(200, Math.round(data.height))));
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [allowedHosts, initialProps]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (app.provider === 'remote-url') {
    const src = app.embed_url || '';
    return (
      <div className={className} role="region" aria-label={`Vibe App: ${app.name}`}>
        {!mounted && posterUrl && (
          <div className="relative w-full overflow-hidden rounded-lg border border-white/10 bg-white/5" style={{ paddingTop: `${aspect * 100}%` }}>
            <img src={posterUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          </div>
        )}
        {mounted && (
          <iframe
            ref={iframeRef}
            src={src}
            title={`Vibe App ${app.name}`}
            className="w-full rounded-lg border border-white/10 bg-white"
            style={{ height: fullHeight ? '100vh' as any : (height as any) }}
            loading="lazy"
            sandbox="allow-scripts allow-forms allow-pointer-lock allow-popups allow-downloads"
            allow="fullscreen"
            allowFullScreen
          />
        )}
      </div>
    );
  }

  // npm-embed: only render if this package is bundled/known at build-time.
  return (
    <div className={`rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/80 ${className}`}>
      This Vibe App uses an npm embed. Dynamic runtime imports of arbitrary packages are disabled for safety. Bundle this
      package ({app.npm_pkg}) with a known entry ({app.entry_name}) to enable inline rendering.
    </div>
  );
}
