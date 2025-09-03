"use client";
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Post = { id: string; title?: string; body?: string; url?: string; created_at?: string; account?: { platform: string; handle: string } }

export default function ReviewInboxPage() {
  const [items, setItems] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [blocked, setBlocked] = useState<string>('')
  useEffect(()=>{ supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || '')) }, [])

  const load = async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/social/posts?status=new&userId=${encodeURIComponent(userId)}`)
      if (res.status === 403) {
        const js = await res.json().catch(()=>({}))
        setBlocked(js?.message || 'This feature is disabled. Enable ENABLE_SOCIAL_INGEST or IS_CLOUD=true.')
        setItems([])
        return
      }
      const js = await res.json().catch(()=>({posts:[]}))
      setItems(js.posts||[])
    } catch {
      setItems([])
    }
  }
  useEffect(()=>{ load() },[userId])

  const convert = async (id: string) => {
    setLoading(true)
    const r = await fetch(`/api/social/posts/${id}/convert`, { method: 'POST' }).then(r=>r.json()).catch(()=>null)
    setLoading(false)
    if (r?.draft) {
      // For v1, push into local DraftPanel via window event (simple handoff)
      window.dispatchEvent(new CustomEvent('draft:open', { detail: r.draft }))
    }
  }

  const ignore = async (id: string) => {
    await fetch('/api/social/posts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'ignored', userId }) }).catch(()=>{})
    await load()
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Review Inbox</h1>
        <button onClick={load} className="text-xs px-2 py-1 rounded bg-white/10">Refresh</button>
      </div>
      {blocked && (
        <div className="text-sm text-amber-300 border border-amber-500/30 bg-amber-500/10 rounded p-3">
          {blocked}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3">
        {items.map(it => (
          <div key={it.id} className="border border-white/10 bg-white/5 rounded p-3">
            <div className="text-xs text-white/60">From {it.account?.platform} · {it.account?.handle} · {new Date(it.created_at||'').toLocaleString()}</div>
            <div className="text-sm font-medium mt-1">{it.title || (it.body?.slice(0,80) || 'Untitled')}</div>
            {it.url && <a href={it.url} target="_blank" rel="noreferrer" className="text-[12px] text-cherry-300">{it.url}</a>}
            <div className="flex gap-2 mt-2">
              <button disabled={loading} onClick={()=>convert(it.id)} className="text-xs px-2 py-1 rounded bg-cherry-500">Convert</button>
              <button onClick={()=>ignore(it.id)} className="text-xs px-2 py-1 rounded bg-white/10">Ignore</button>
            </div>
          </div>
        ))}
        {items.length===0 && <div className="text-sm text-white/60">No new imports.</div>}
      </div>
    </div>
  )
}
