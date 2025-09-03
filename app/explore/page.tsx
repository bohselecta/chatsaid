"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES } from "@/lib/nav/categories";
import CategoryRail from "@/components/nav/CategoryRail";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  branch_type: string;
  is_primary_branch: boolean;
  member_count: number;
  post_count: number;
}

interface Twig {
  id: string;
  name: string;
  slug: string;
  description: string;
  branch_id: string;
  member_count: number;
  post_count: number;
}

export default function ExplorePage() {
  const [branches, setBranches] = useState<Community[]>([]);
  const [twigs, setTwigs] = useState<Twig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadBranches();
    void loadTwigs();
  }, []);

  async function loadBranches() {
    try {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("is_primary_branch", true)
        .order("name");
      if (error) throw error;
      setBranches(data || []);
    } catch (err) {
      console.error("Error loading branches:", err);
      setError("Failed to load branches");
    }
  }

  async function loadTwigs() {
    try {
      const { data, error } = await supabase
        .from("twigs")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      setTwigs(data || []);
    } catch (err) {
      console.error("Error loading twigs:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-white">
        <div className="animate-pulse">
          <div className="mb-6 h-8 rounded bg-white/10" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl border border-white/10 bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-white">
        <div className="text-center">
          <p className="mb-4 text-lg text-rose-300">{error}</p>
          <button
            onClick={loadBranches}
            className="rounded-lg bg-rose-500 px-4 py-2 text-white transition-colors hover:bg-rose-500/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 text-white">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Discover</h1>
          <p className="mt-1 text-sm text-white/70">Explore communities and niches within ChatSaid</p>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 md:flex">
          <span className="opacity-70">Search...</span>
        </div>
      </header>

      <CategoryRail className="mb-6" />

      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold text-white">Primary Branches</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-xl border border-white/10 bg-white/[.03] p-6 shadow-card transition-colors hover:border-white/20"
            >
              <div className="text-center">
                {(() => {
                  const key = branch.branch_type === "mystical" ? "weird" : branch.branch_type;
                  const cat = CATEGORIES.find((c) => c.key === (key as any));
                  return <img src={cat?.iconPath || "/ideas.svg"} alt="" className="mx-auto mb-3 h-10 w-10" />;
                })()}
                <h3 className="mb-2 text-xl font-semibold text-white">{branch.name}</h3>
                <p className="mb-4 line-clamp-2 text-sm text-white/70">{branch.description}</p>
                <div className="mb-4 flex items-center justify-center gap-4 text-xs text-white/60">
                  <div className="flex items-center gap-1">
                    <span>👥</span>
                    <span>{branch.member_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📝</span>
                    <span>{branch.post_count}</span>
                  </div>
                </div>
                <a
                  href={`/branch/${branch.branch_type}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500/90"
                >
                  Explore Branch <span>→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-white">All Twigs</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {twigs.map((twig) => {
            const branch = branches.find((b) => b.id === twig.branch_id);
            return (
              <div
                key={twig.id}
                className="rounded-lg border border-white/10 bg-white/[.03] p-4 shadow-card transition-colors hover:border-white/20"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white">{twig.name}</h4>
                    {branch && (
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        {(() => {
                          const key = branch.branch_type === "mystical" ? "weird" : branch.branch_type;
                          const cat = CATEGORIES.find((c) => c.key === (key as any));
                          return <img src={cat?.iconPath || "/ideas.svg"} alt="" className="h-4 w-4" />;
                        })()}
                        <span>{branch.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-white/60">
                    <div>{twig.post_count} cherries</div>
                    <div>{twig.member_count} members</div>
                  </div>
                </div>
                <p className="mb-3 line-clamp-2 text-sm text-white/70">{twig.description}</p>
                <a
                  href={`/branch/${branch?.branch_type}?twig=${twig.slug}`}
                  className="inline-flex items-center gap-1 text-sm text-rose-400 hover:underline"
                >
                  View Twig <span>→</span>
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

