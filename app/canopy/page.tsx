"use client";

import DeskCap from "@/components/canopy/DeskCap";
import UtilityBar from "@/components/canopy/UtilityBar";
import CherryGrid from "@/components/canopy/CherryGrid";
import VirtualFeed from "@/components/canopy/VirtualFeed";
import { LoadingState, EmptyState, ErrorState } from "@/components/canopy/States";
import SkeletonGrid from "@/components/canopy/SkeletonGrid";
import useCanopyFeed from "@/lib/hooks/useCanopyFeed";
import { useEffect, useSearchParams } from "next/navigation";
import { useEffect as ReactUseEffect, useState } from "react";

export default function CanopyPage() {
  return (
    <main>
      <DeskCap />
      <UtilityBar />
      <FeedSection />
    </main>
  );
}

function FeedSection() {
  const params = useSearchParams();
  const delay = Math.max(0, Number(params?.get("delay") || 0)) || 0;
  const [delaying, setDelaying] = useState(delay > 0);
  useEffect(() => {
    let t: any;
    if (delay > 0) {
      setDelaying(true);
      t = setTimeout(() => setDelaying(false), delay);
    } else {
      setDelaying(false);
    }
    return () => t && clearTimeout(t);
  }, [delay]);
  const sort = (params?.get("sort") || "trending").toString();
  const cats = params?.getAll("cat") || [];
  const qUrl = params?.get("q") || "";
  const [liveQ, setLiveQ] = useState<string | undefined>(undefined);
  const { cherries = [], loading, error, hasMore, loadMore } = useCanopyFeed({ sortBy: sort });

  // Listen to debounced live search without URL churn
  ReactUseEffect(() => {
    const handler = (e: any) => setLiveQ(e?.detail?.q ?? '');
    window.addEventListener('canopy:search-live', handler as any);
    return () => window.removeEventListener('canopy:search-live', handler as any);
  }, []);

  if (error) return (
    <div className="mx-auto max-w-6xl px-4 py-6"><ErrorState /></div>
  );
  if (delaying) return <SkeletonGrid count={8} />;
  if (loading && cherries.length === 0) return <SkeletonGrid count={8} />;

  // Apply filters client-side for now
  let items = cherries as any[];
  if (cats.length) {
    const map: Record<string, string[]> = {
      funny: ["humor", "funny", "comedy"],
      weird: ["philosophy", "metaphysical", "spiritual", "mystical", "weird"],
      technical: ["coding", "tech", "programming"],
      research: ["research", "academic", "study"],
      ideas: ["creativity", "ideas", "inspiration"],
    };
    items = items.filter((ch) => {
      const tags: string[] = ch.tags || [];
      return cats.some((c) => (map[c] || []).some((t) => tags.includes(t)));
    });
  }
  const effectiveQ = (liveQ ?? qUrl).toString();
  if (effectiveQ.trim()) {
    const qq = effectiveQ.toLowerCase();
    items = items.filter((c) => `${c.title || ''} ${c.content || ''}`.toLowerCase().includes(qq));
  }

  if (!items.length) return (
    <div className="mx-auto max-w-6xl px-4 py-6"><EmptyState /></div>
  );

  // Dev seed to inflate items for virtualization QA
  const seed = Math.max(0, Number(params?.get("seed") || 0)) || 0;
  const base = items ?? [];
  const seeded = seed > base.length && base.length > 0
    ? Array.from({ length: seed }, (_, i) => ({ ...base[i % base.length], id: `${base[i % base.length].id}-seed${i}` }))
    : base;

  const onReaction = async (id: string, key: string) => {
    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cherryId: id, userId: 'anonymous', reactionType: key })
      });
    } catch {}
  };
  const onSaveToCategory = async (id: string, category: string) => {
    // demo: local only, real API can be wired later
    console.log('save', id, category);
  };
  const onLike = async (id: string) => console.log('like', id);

  // Threshold for virtualization (placeholder: same grid for now)
  const USE_VIRTUAL = seeded.length > 80;
  return USE_VIRTUAL ? (
    <VirtualFeed items={seeded} onReaction={onReaction} onSaveToCategory={onSaveToCategory} onLike={onLike} />
  ) : (
    <CherryGrid items={seeded} onReaction={onReaction} onSaveToCategory={onSaveToCategory} onLike={onLike} />
  );
}
