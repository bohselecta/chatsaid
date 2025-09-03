"use client";
import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(q);
      }}
      className="w-full"
      role="search"
      aria-label="Site search"
    >
      <label className="group relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          placeholder="Discover cherries…"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-rose-400/40"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
    </form>
  );
}

