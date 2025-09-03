"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { track } from "@/lib/analytics/events";

const SORTS = ["trending", "newest", "saved"] as const;
const CATS = ["funny", "weird", "technical", "research", "ideas"] as const;

export default function UtilityBar() {
  const router = useRouter();
  const params = useSearchParams();
  const cats = params?.getAll("cat") ?? [];
  const q = params?.get("q") ?? "";
  const [liveQ, setLiveQ] = useState(q);
  const sort = ((params?.get("sort") as any) ?? "trending") as (typeof SORTS)[number];

  const replace = (next: URLSearchParams) =>
    router.replace(`/canopy?${next.toString()}`, { scroll: false });

  const toggleCat = (value: string) => {
    const next = new URLSearchParams(params?.toString() || "");
    const curr = next.getAll("cat").filter((c) => c !== value);
    next.delete("cat");
    curr.forEach((c) => next.append("cat", c));
    if (!cats.includes(value)) next.append("cat", value);
    track("canopy_filter_change", { cats: next.getAll("cat") });
    replace(next);
  };

  const submitSearch = (value: string) => {
    const next = new URLSearchParams(params?.toString() || "");
    value ? next.set("q", value) : next.delete("q");
    track("canopy_search", { q: value });
    replace(next);
  };

  // Debounced live updates without URL churn
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (liveQ !== q) {
        try {
          window.dispatchEvent(new CustomEvent('canopy:search-live', { detail: { q: liveQ } }));
          if (liveQ.trim()) track('canopy_search_live', { q: liveQ });
        } catch {}
      }
    }, 200);
    return () => window.clearTimeout(id);
  }, [liveQ, q]);

  const setSort = (s: (typeof SORTS)[number]) => {
    const next = new URLSearchParams(params?.toString() || "");
    next.set("sort", s);
    track("canopy_sort_change", { sort: s });
    replace(next);
  };

  return (
    <div className="sticky top-[64px] z-20 bg-[rgb(var(--panel))]/92 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-3">
        <nav aria-label="Categories" className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATS.map((c) => {
            const active = cats.includes(c);
            return (
              <button
                key={c}
                type="button"
                className={clsx(
                  "rounded-full px-3 py-1 text-sm border focus-ring",
                  active
                    ? "bg-white text-black border-transparent"
                    : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                )}
                aria-pressed={active}
                onClick={() => toggleCat(c)}
              >
                {c[0].toUpperCase() + c.slice(1)}
              </button>
            );
          })}
        </nav>

        <form
          className="ml-auto flex-1 max-w-sm"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const value = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
            submitSearch(value);
          }}
        >
          <input
            name="q"
            value={liveQ}
            onChange={(e)=> setLiveQ(e.currentTarget.value)}
            type="search"
            placeholder="Search posts"
            aria-label="Search posts"
            className="w-full rounded-md border border-white/10 bg-white/5 text-white placeholder-white/50 px-3 py-2 focus-ring"
          />
        </form>

        <div className="flex items-center gap-2">
          <label className="text-white/70 text-sm" htmlFor="sort">
            Sort
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-md bg-white/5 text-white border border-white/10 px-2 py-1 text-sm focus-ring"
          >
            <option value="trending">Trending</option>
            <option value="newest">Newest</option>
            <option value="saved">Saved</option>
          </select>
        </div>
      </div>
    </div>
  );
}
