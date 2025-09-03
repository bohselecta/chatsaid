'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push(`/profile/${user.id}`);
      } else {
        router.push('/login');
      }
    };

    redirectToProfile();
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
        <p className="text-[var(--muted)]">Redirecting to your profile...</p>
      </div>
    </div>
  );
}
