"use client";
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Account = { id: string; platform: string; handle: string; status: string }
type Rule = { account_id: string; persona_slug?: string | null; branch?: string | null; filters?: any; image_policy?: 'none' | 'suggest' | 'auto-generate'; auto_convert?: boolean }

export default function SocialSettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [platform, setPlatform] = useState('rss')
  const [handle, setHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [rules, setRules] = useState<Record<string, Rule>>({})
  const [openRule, setOpenRule] = useState<string>('')

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || '')) }, [])

  const load = async () => {
    if (!userId) return
    const r = await fetch(`/api/social/accounts?userId=${encodeURIComponent(userId)}`).then(r=>r.json()).catch(()=>({accounts:[]}))
    setAccounts(r.accounts||[])
    const rr = await fetch(`/api/social/rules?userId=${encodeURIComponent(userId)}`).then(r=>r.json()).catch(()=>({rules:[]}))
    const map: Record<string, Rule> = {}
    ;(rr.rules||[]).forEach((x: Rule) => { map[x.account_id] = x })
    setRules(map)
  }
  useEffect(()=>{ load() },[userId])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/social/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, platform, handle, config: { rss_url: platform==='rss' ? handle : undefined } }) })
    setHandle('')
    await load()
    setLoading(false)
  }

  const setStatus = async (id: string, action: 'pause'|'resume') => {
    await fetch(`/api/social/accounts/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, userId }) })
    await load()
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-semibold">Social Connections</h1>
      <form onSubmit={add} className="flex gap-2 items-end">
        <label className="text-sm">
          <div className="text-xs text-white/70">Platform</div>
          <select value={platform} onChange={(e)=>setPlatform(e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1">
            <option value="rss">RSS</option>
            <option value="youtube">YouTube</option>
            <option value="reddit">Reddit</option>
            <option value="x">X (via RSS/Nitter)</option>
            <option value="email">Email-in</option>
          </select>
        </label>
        <label className="flex-1 text-sm">
          <div className="text-xs text-white/70">Handle / URL</div>
          <input required value={handle} onChange={(e)=>setHandle(e.target.value)} placeholder={platform==='rss'?'https://example.com/feed.xml':'@handle or channel id'} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1" />
        </label>
        <button disabled={loading || !handle.trim()} className="px-3 py-1.5 rounded bg-cherry-500 disabled:opacity-60">Add</button>
      </form>

      <div className="space-y-2">
        {accounts.map(a => (
          <div key={a.id} className="border border-white/10 bg-white/5 rounded">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="text-sm">{a.platform} · <span className="text-white/80">{a.handle}</span> <span className="ml-2 text-xs text-white/60">{a.status}</span></div>
              <div className="flex gap-2">
                <button onClick={()=>setOpenRule(v => v===a.id?'':a.id)} className="text-xs px-2 py-1 rounded bg-white/10">{openRule===a.id?'Hide rules':'Rules'}</button>
                {a.status !== 'paused' ? (
                  <button onClick={()=>setStatus(a.id,'pause')} className="text-xs px-2 py-1 rounded bg-white/10">Pause</button>
                ) : (
                  <button onClick={()=>setStatus(a.id,'resume')} className="text-xs px-2 py-1 rounded bg-white/10">Resume</button>
                )}
              </div>
            </div>
            {openRule===a.id && (
              <RuleEditor
                key={`rule-${a.id}`}
                accountId={a.id}
                initial={rules[a.id]}
                onSave={async (val) => {
                  await fetch('/api/social/rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, accountId: a.id, ...val }) })
                  await load()
                }}
                userId={userId}
              />
            )}
          </div>
        ))}
        {accounts.length===0 && <div className="text-sm text-white/60">No accounts yet.</div>}
      </div>
    </div>
  )
}

function RuleEditor({ accountId, initial, onSave, userId }: { accountId: string; initial?: Rule; onSave: (val: Partial<Rule>) => Promise<void>; userId?: string }) {
  const [persona, setPersona] = useState<string>(initial?.persona_slug || '')
  const [branch, setBranch] = useState<string>(initial?.branch || '')
  const [include, setInclude] = useState<string>((initial?.filters?.include || []).join(', '))
  const [exclude, setExclude] = useState<string>((initial?.filters?.exclude || []).join(', '))
  const [imagePolicy, setImagePolicy] = useState<'none'|'suggest'|'auto-generate'>(initial?.image_policy || 'suggest')
  const [auto, setAuto] = useState<boolean>(!!initial?.auto_convert)
  const [saving, setSaving] = useState(false)
  const [personaOptions, setPersonaOptions] = useState<string[]>(['designer','researcher','storyteller'])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        if (!userId) return
        const { data } = await supabase.from('personas').select('display_name').eq('user_id', userId)
        const names = (data || []).map((p: any) => p.display_name).filter(Boolean)
        if (mounted && names.length) setPersonaOptions(Array.from(new Set([...names, ...personaOptions])))
      } catch {}
    }
    load()
    return () => { mounted = false }
  }, [userId])

  const save = async () => {
    setSaving(true)
    const filters = {
      include: include.split(',').map(s=>s.trim()).filter(Boolean),
      exclude: exclude.split(',').map(s=>s.trim()).filter(Boolean),
    }
    await onSave({ persona_slug: persona || null, branch: branch || null, filters, image_policy: imagePolicy, auto_convert: auto })
    setSaving(false)
  }

  return (
    <div className="px-3 pb-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs">
          <div className="text-[11px] text-white/70">Persona</div>
          <select value={persona} onChange={e=>setPersona(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm">
            <option value="">(none)</option>
            {personaOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <div className="text-[11px] text-white/70">Branch</div>
          <input value={branch} onChange={e=>setBranch(e.target.value)} placeholder="e.g. technical" className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm" />
        </label>
        <label className="text-xs">
          <div className="text-[11px] text-white/70">Include keywords (comma separated)</div>
          <input value={include} onChange={e=>setInclude(e.target.value)} placeholder="ai, design" className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm" />
        </label>
        <label className="text-xs">
          <div className="text-[11px] text-white/70">Exclude keywords (comma separated)</div>
          <input value={exclude} onChange={e=>setExclude(e.target.value)} placeholder="retweet" className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm" />
        </label>
        <label className="text-xs">
          <div className="text-[11px] text-white/70">Image policy</div>
          <select value={imagePolicy} onChange={e=>setImagePolicy(e.target.value as any)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm">
            <option value="none">none</option>
            <option value="suggest">suggest</option>
            <option value="auto-generate">auto-generate</option>
          </select>
        </label>
        <label className="text-xs flex items-center gap-2 mt-5">
          <input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)} />
          Auto-convert to draft
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 rounded bg-cherry-500 disabled:opacity-60">{saving ? 'Saving…' : 'Save rules'}</button>
      </div>
    </div>
  )
}
