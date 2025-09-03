"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type CherryCategoryKey = "funny" | "weird" | "technical" | "research" | "ideas";

type CherryCardProps = {
  id: string;
  authorName: string;
  timeAgo: string;
  title: string;
  excerpt?: string;
  thumbnailUrl?: string | null;
  likes?: number;
  badgeIcon?: React.ReactNode;
  className?: string;
  onPick?: (p: { id: string; category: CherryCategoryKey }) => void;
  onLike?: (id: string) => void;
  variant?: 'default' | 'compact' | 'wide';
};

const CATEGORY_META: Record<CherryCategoryKey, { label: string; Icon: (props: { className?: string }) => JSX.Element }> = {
  funny: { label: "Funny", Icon: (p) => <SmileyIcon {...p} /> },
  weird: { label: "Weird", Icon: (p) => <AlienIcon {...p} /> },
  technical: { label: "Technical", Icon: (p) => <WrenchIcon {...p} /> },
  research: { label: "Research", Icon: (p) => <SearchIcon {...p} /> },
  ideas: { label: "Ideas", Icon: (p) => <BulbIcon {...p} /> },
};

export function CherryCard(props: CherryCardProps) {
  const {
    id,
    authorName,
    timeAgo,
    title,
    excerpt,
    thumbnailUrl,
    likes = 0,
    badgeIcon,
    className = "",
    variant = 'default',
    onPick,
    onLike,
  } = props;

  const [open, setOpen] = useState(false);
  const btnId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!menuRef.current?.contains(target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClick); };
  }, [open]);

  const likeDisplay = useMemo(() => new Intl.NumberFormat().format(likes), [likes]);

  const hasThumb = !!thumbnailUrl && variant !== 'compact';
  const wide = variant === 'wide';

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#141518] text-white shadow-xl ${className}`}>
      {/* Thumbnail */}
      {hasThumb && (
        <div className={`${wide ? 'relative h-40' : 'relative'}`}>
          <img
            src={thumbnailUrl}
            alt="Cherry thumbnail"
            className={`${wide ? 'absolute inset-0 h-full w-full object-cover' : 'h-44 w-full object-cover'}`}
            loading="lazy"
          />
          {/* Badge */}
          {badgeIcon && (
            <div className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-black/50 backdrop-blur">
              {badgeIcon}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`p-4 ${wide ? 'md:flex md:items-start md:gap-4' : ''}`}>
        {wide && hasThumb && (
          <div className="hidden md:block md:w-48 md:flex-shrink-0">
            <div className="relative h-28 w-48 overflow-hidden rounded-xl border border-white/10">
              <img src={thumbnailUrl!} alt="thumb" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between text-xs text-white/60">
            <div className="truncate">{authorName}</div>
          <div className="whitespace-nowrap">{timeAgo}</div>
          </div>

        <h3 className="mb-1 line-clamp-2 text-base font-semibold tracking-tight text-white">{title}</h3>
        {excerpt && variant !== 'compact' && (
          <p className={`text-sm text-white/70 ${wide ? 'line-clamp-2' : 'line-clamp-3'}`}>{excerpt}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <button
            id={btnId}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
          >
            Pick Cherry
          </button>

          <button
            onClick={() => onLike?.(id)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
            aria-label="Like"
          >
            <HeartIcon className="h-4 w-4" /> {likeDisplay}
          </button>
        </div>

        {/* Category tray */}
        <div className="relative">
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                role="menu"
                aria-labelledby={btnId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.16 }}
                className="absolute left-1/2 z-20 mt-3 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-800/95 backdrop-blur p-2 shadow-2xl"
              >
                <ul className="flex items-center gap-1">
                  {(Object.keys(CATEGORY_META) as CherryCategoryKey[]).map((key) => {
                    const { label, Icon } = CATEGORY_META[key];
                    return (
                      <li key={key}>
                        <button
                          role="menuitem"
                          onClick={() => {
                            onPick?.({ id, category: key });
                            setOpen(false);
                          }}
                          className="group grid place-items-center rounded-xl px-3 py-2 text-slate-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2"
                          title={label}
                          aria-label={label}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="mt-1 text-[11px] font-medium opacity-80">{label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Inline icons (no external deps)
// -----------------------------
export function BulbIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.6">
      <path d="M9 18h6M10 21h4" strokeLinecap="round" />
      <path d="M12 2a7 7 0 0 0-4 12c.6.6 1 1.6 1 2.5V17h6v-.5c0-.9.4-1.9 1-2.5A7 7 0 0 0 12 2Z" />
    </svg>
  );
}

function SmileyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 10h.01M16 10h.01" strokeLinecap="round" />
      <path d="M8 14c1.3 1.3 3.7 1.3 4 1.3s2.7 0 4-1.3" strokeLinecap="round" />
    </svg>
  );
}

function AlienIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.6">
      <ellipse cx="12" cy="12" rx="8" ry="10" />
      <ellipse cx="9" cy="12" rx="2" ry="3" />
      <ellipse cx="15" cy="12" rx="2" ry="3" />
      <path d="M9 17c1 .7 2 .7 3 .7s2 0 3-.7" />
    </svg>
  );
}

function WrenchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.6">
      <path d="M21 7a6 6 0 0 1-8 8l-7 7-3-3 7-7a6 6 0 0 1 8-8l-3 3 6 0z" />
    </svg>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.6">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21s-7-4.6-9.3-7.6C1 11.4 2.3 8 5.6 7.4 7.7 7 9.4 8.3 10 9.8c.6-1.5 2.3-2.8 4.4-2.4 3.3.6 4.6 4 2.9 6-2.3 3-9.3 7.6-9.3 7.6Z" />
    </svg>
  );
}

// -----------------------------
// Example usage (for quick preview)
// -----------------------------
export function CherryCardDemo() {
  const [lastPick, setLastPick] = useState<string>("");
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-4">
        <CherryCard
          id="demo-1"
          authorName="Unknown"
          timeAgo="1 day ago"
          title="Colors of the Mind"
          excerpt="Art is the universe expressing itself through our imagination’s palette."
          thumbnailUrl="https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop"
          likes={54}
          badgeIcon={<BulbIcon className="h-5 w-5" />}
          onPick={({ id, category }) => setLastPick(`${id}:${category}`)}
        />
        {lastPick && (
          <div className="mt-4 text-sm text-slate-300">Last pick → {lastPick}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Integration note for host app:
 *
 * <CherryCard onPick={({id, category}) =>
 *   router.push(`/my-room?add=${id}&category=${category}`)
 * } />
 *
 * or call a mutation to save to the user's Cherry Board, then show a toast.
 */
