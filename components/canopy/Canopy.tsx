"use client";

import React, { useMemo, useState } from "react";
import useCanopyFeed from "@/lib/hooks/useCanopyFeed";
import { CherryCard } from "@/components/cherry/CherryCard";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  variant?: 'grid' | 'list';
  cardVariant?: 'default' | 'compact' | 'wide';
  pageSize?: number;
};

export default function Canopy({ variant = 'grid', cardVariant = 'default', pageSize = 20 }: Props) {
  const { cherries, loading, error, hasMore, loadMore } = useCanopyFeed({ pageSize });
  const [toast, setToast] = useState<string | null>(null);

  const layoutClass = useMemo(() => {
    if (variant === 'list') return 'space-y-3';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3';
  }, [variant]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header (minimal, can add filters later) */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Canopy</h1>
        {/* room for filters/sort controls */}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Grid/List */}
      <div className={layoutClass}>
        {loading && cherries.length === 0 && <SkeletonGrid variant={variant} />}
        {cherries.map((c) => (
          <CherryCard
            key={c.id}
            id={c.id}
            authorName={c.author_display_name || 'Unknown'}
            timeAgo={new Date(c.created_at).toLocaleDateString()}
            title={c.title || c.content?.slice(0, 120) || 'Untitled'}
            excerpt={c.content?.slice(0, 220)}
            thumbnailUrl={undefined}
            likes={c.engagement_score || 0}
            variant={cardVariant}
            onPick={async ({ id, category }) => {
              try {
                const { data: user } = await supabase.auth.getUser();
                const userId = user.user?.id || 'anonymous';
                const res = await fetch('/api/reactions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ cherryId: id, userId, reactionType: 'star', category }),
                });
                const out = await res.json();
                if (!res.ok) throw new Error(out?.error || res.statusText);
                setToast(out?.message || 'Saved to your Cherry Board');
                setTimeout(() => setToast(null), 2500);
              } catch (e: any) {
                setToast(e?.message || 'Could not save cherry');
                setTimeout(() => setToast(null), 2500);
              }
            }}
          />
        ))}
      </div>

      {/* Load more */}
      <div className="mt-6 flex items-center justify-center">
        {hasMore && (
          <button onClick={loadMore} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">
            {loading ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </div>
    {toast && (
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-white/10 bg-black/80 px-3 py-2 text-sm text-white shadow-lg">
        {toast}
      </div>
    )}
  );
}

function SkeletonGrid({ variant }: { variant: 'grid' | 'list' }) {
  const count = variant === 'list' ? 4 : 6;
  return (
    <div className={variant === 'list' ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      ))}
    </div>
  );
}
