'use client';

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useWriter } from "@/lib/ui/useWriter";
import { track } from "@/lib/analytics/events";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const openWriterFromNav = () => {
    track('nav_click', { item: 'create' });
    track('writer_open', { source: 'nav' });
    useWriter.getState().openWriter();
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const signOut = async () => { 
    await supabase.auth.signOut();
    setShowDropdown(false);
  };

  const handleProfileClick = () => {
    if (profile) {
      router.push(`/profile/${profile.id}`);
    }
    setShowDropdown(false);
  };

  const handleSettingsClick = () => {
    router.push('/settings');
    setShowDropdown(false);
  };

  const handleMindMapClick = () => {
    router.push('/mindmap');
    setShowDropdown(false);
  };

  const handleAdminClick = () => {
    router.push('/admin');
    setShowDropdown(false);
  };

  const handleBotTwinClick = () => {
    router.push('/bot-twin');
    setShowDropdown(false);
  };

  return (
    <nav className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded focus-ring"
          aria-label="Home"
          aria-current={isActive("/") ? "page" : undefined}
        >
          <Image src="/assets/logo-chatsaid-light.png" alt="ChatSaid" width={126} height={24} priority />
        </Link>
        <button
          type="button"
          onClick={openWriterFromNav}
          aria-label="Create a post"
          className="rounded-md px-3 py-1 text-sm border border-black/10 hover:bg-black/5 focus-ring"
        >
          Create
        </button>
        <Link
          href="/explore"
          onClick={() => track('nav_click', { item: 'discover' })}
          className={`rounded-md px-3 py-1 text-sm focus-ring ${isActive('/explore') ? 'bg-black/5 text-black dark:bg-white/10 dark:text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
          aria-label="Discover"
          aria-current={isActive('/explore') ? 'page' : undefined}
        >
          Discover
        </Link>
        <Link
          href="/home/me"
          onClick={() => track('nav_click', { item: 'organize' })}
          className={`rounded-md px-3 py-1 text-sm focus-ring ${isActive('/home/me') ? 'bg-black/5 text-black dark:bg-white/10 dark:text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
          aria-label="Organize"
          aria-current={isActive('/home/me') ? 'page' : undefined}
        >
          Organize
        </Link>
      </div>
      {user ? (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Profile menu"
          >
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold text-sm">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={`${profile.display_name || 'User'} avatar`}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                (profile?.display_name?.[0] || 'U').toUpperCase()
              )}
            </div>
            
            {/* Display Name */}
            <span className="text-[var(--fg)] font-medium hidden sm:block">
              {profile?.display_name || 'User'}
            </span>
            
            {/* Dropdown Arrow */}
            <svg 
              className={`w-4 h-4 text-[var(--muted)] transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-[var(--card)] rounded-lg shadow-lg border border-white/10 py-2 z-50">
              <button
                onClick={() => { router.push('/home/me'); setShowDropdown(false); }}
                className="w-full px-4 py-2 text-left text-[var(--fg)] hover:bg-white/5 transition-colors flex items-center gap-3"
              >
                <span>🏠</span>
                Home
              </button>
              <button
                onClick={handleProfileClick}
                className="w-full px-4 py-2 text-left text-[var(--fg)] hover:bg-white/5 transition-colors flex items-center gap-3"
              >
                <span>ðŸ‘¤</span>
                View Profile
              </button>
              
              <button
                onClick={handleMindMapClick}
                className="w-full px-4 py-2 text-left text-[var(--fg)] hover:bg-white/5 transition-colors flex items-center gap-3"
              >
                <span>ðŸ§ </span>
                Mind Map
              </button>
              
              <button
                onClick={handleBotTwinClick}
                className="w-full px-4 py-2 text-left text-[var(--fg)] hover:bg-white/5 transition-colors flex items-center gap-3"
              >
                <span>ðŸ¤–</span>
                Bot Twin
              </button>
              
              <button
                onClick={() => { router.push('/inbox'); setShowDropdown(false); }}
                className="w-full px-4 py-2 text-left text-[var(--fg)] hover:bg-white/5 transition-colors flex items-center gap-3"
                aria-label="Review Inbox"
              >
                <span>•</span>
                Inbox
              </button>
              
              <button
                onClick={() => { router.push('/settings/social'); setShowDropdown(false); }}
                className="w-full px-4 py-2 text-left text-[var(--fg)] hover:bg-white/5 transition-colors flex items-center gap-3"
                aria-label="Social Connections"
              >
                <span>☆</span>
                Social Connections
              </button>
              
              <button
                onClick={() => {
                  router.push('/enhanced-canopy');
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-[var(--fg)] hover:bg-white/5 transition-colors flex items-center gap-3"
              >
                <span>dY"?</span>
                Enhanced Canopy
              </button>
              
              <button
                onClick={() => {
                  router.push('/bot-analytics');
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-[var(--fg)] hover:bg-white/5 transition-colors flex items-center gap-3"
              >
                <span>ðŸ“Š</span>
                Bot Analytics
              </button>
              
              <button
                onClick={handleSettingsClick}
                className="w-full px-4 py-2 text-left text-[var(--fg)] hover:bg-white/5 transition-colors flex items-center gap-3"
              >
                <span>âš™ï¸</span>
                Settings
              </button>
              
              <div className="border-t border-white/10 my-1"></div>
              
              <button
                onClick={handleAdminClick}
                className="w-full px-4 py-2 text-left text-[var(--fg)] hover:bg-white/5 transition-colors flex items-center gap-3"
              >
                <span>ðŸ›¡ï¸</span>
                Admin
              </button>
              
              <div className="border-t border-white/10 my-1"></div>
              
              <button
                onClick={signOut}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
              >
                <span>ðŸšª</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      ) : (
        <a href="/login" className="text-sm underline hover:text-red-400 transition-colors">Log in</a>
      )}
    </nav>
  );
}

