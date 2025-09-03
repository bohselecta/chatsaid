'use client';

import { useEffect, useState } from "react";
import NavBar from "./NavBar";
import Logo from "./Logo";
import CategoryRail from "@/components/nav/CategoryRail";
import SearchBar from "@/components/nav/SearchBar";
import { Search } from "lucide-react";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="xl:hidden fixed top-4 right-4 z-[70]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-[var(--card)] rounded-lg border border-white/10 shadow-lg"
          aria-label="Toggle mobile menu"
        >
          <div className="w-6 h-6 flex flex-col justify-center items-center">
            <span className={`block w-5 h-0.5 bg-[var(--fg)] transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
            <span className={`block w-5 h-0.5 bg-[var(--fg)] transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`block w-5 h-0.5 bg-[var(--fg)] transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="xl:hidden fixed inset-0 z-[60] bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="absolute top-0 right-0 w-80 h-full bg-[var(--card)] border-l border-white/10 shadow-2xl z-[70]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header with Logo and Close Button */}
              <div className="flex items-center justify-between mb-6">
                <Logo size="sm" />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-6">
                {/* Main Navigation */}
                <div>
                  <a
                    href="/canopy"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-lg font-medium text-[var(--fg)]"
                  >
                    Canopy
                  </a>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10"></div>

                {/* Branch Navigation */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--muted)] mb-3 px-3">Main Branches</h3>
                  <div className="px-3">
                    <CategoryRail variant="list" />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10"></div>

                {/* Other Navigation */}
                <div className="space-y-2">
                  <div className="px-3">
                    <SearchBar onSearch={(q) => { window.location.href = `/explore?q=${encodeURIComponent(q)}`; }} />
                  </div>
                  <a
                    href="/explore"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-[var(--fg)]"
                  >
                    <Search className="w-4 h-4" aria-hidden />
                    <span>Explore</span>
                  </a>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10"></div>

                {/* User Settings */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--muted)] mb-3 px-3">User Settings</h3>
                  <div className="px-3">
                    <NavBar />
                  </div>
                </div>

                {/* Learn Section */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--muted)] mb-3 px-3">Learn</h3>
                  <a
                    href="/about"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-[var(--fg)]"
                  >
                    <span>About</span>
                  </a>
                  <a
                    href="/help"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-[var(--fg)]"
                  >
                    <span>Help</span>
                  </a>
                </div>

                {/* User Section */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--muted)] mb-3 px-3">User</h3>
                  <a href="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-[var(--fg)]">Profile</a>
                  <a href="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-[var(--fg)]">Settings</a>
                  <a href="/mindmap" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-[var(--fg)]">Mind Map</a>
                  <a href="/bot-twin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-[var(--fg)]">Bot Twin</a>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
