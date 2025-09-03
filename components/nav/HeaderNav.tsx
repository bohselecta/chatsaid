"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CategoryRail from "@/components/nav/CategoryRail";
import SearchBar from "@/components/nav/SearchBar";
import Logo from "@/components/Logo";
import NavBar from "@/components/NavBar";
import { Search } from "lucide-react";

export default function HeaderNav() {
  const router = useRouter();
  const [showDock, setShowDock] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDock(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (showDock) dialogRef.current?.focus();
  }, [showDock]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <Link href="/canopy" className="hover:opacity-80 transition-opacity" aria-label="Go to Canopy">
          <Logo size="sm" />
        </Link>

        {/* Center: Category Rail (desktop xl+) */}
        <div className="hidden xl:block min-w-0 flex-1">
          <div className="bg-gray-700/50 rounded-2xl px-6 py-3 border border-gray-600/30 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <CategoryRail variant="chip" />
            </div>
          </div>
        </div>

        {/* Right: Search (md+), Explore, Profile */}
        <div className="flex items-center gap-3 lg:gap-4 w-auto">
          <div className="hidden md:block w-56 lg:w-72">
            <SearchBar onSearch={(q) => router.push(`/explore?q=${encodeURIComponent(q)}`)} />
          </div>
          <a
            href="/explore"
            className="inline-flex items-center gap-2 text-white hover:text-red-500 transition-colors text-sm px-2 py-1.5 rounded-lg hover:bg-gray-700"
            title="Explore"
          >
            <Search className="w-4 h-4" aria-hidden />
            <span>Explore</span>
          </a>
          <div className="hidden xl:block">
            <NavBar />
          </div>
          {/* Dock trigger (for future: filters/help/persona quicks) */}
          <button
            type="button"
            onClick={() => setShowDock(true)}
            className="p-2 rounded-lg hover:bg-gray-700 text-white/80"
            aria-haspopup="dialog"
            aria-controls="site-dock"
            aria-expanded={showDock}
            aria-label="Open site dock"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Dock drawer */}
      {showDock && (
        <div className="fixed inset-0 z-50" aria-labelledby="dock-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDock(false)} />
          <div
            ref={dialogRef}
            tabIndex={-1}
            id="site-dock"
            className="absolute right-0 top-0 h-full w-96 max-w-full bg-gray-800 border-l border-gray-700 shadow-2xl outline-none"
          >
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 id="dock-title" className="text-white font-semibold">Quick Panel</h2>
              <button
                onClick={() => setShowDock(false)}
                className="p-2 rounded hover:bg-gray-700"
                aria-label="Close panel"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-6 text-sm text-white/90">
              <div>
                <div className="text-white/60 mb-2">Categories</div>
                <CategoryRail variant="list" />
              </div>
              <div>
                <div className="text-white/60 mb-2">Search</div>
                <SearchBar onSearch={(q) => router.push(`/explore?q=${encodeURIComponent(q)}`)} />
              </div>
              <div>
                <div className="text-white/60 mb-2">Account</div>
                <NavBar />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
