"use client"
import { useEffect, useRef, useState } from "react"
import { track } from "@/lib/analytics/events"
import { saveDraft, publishPost } from "@/lib/api/posts"
import { getOutline, rewrite as rewriteApi, suggestTitles } from "@/lib/api/assist"
import WriterToolbar, { type WriterCat } from "./writer/WriterToolbar"
import WriterStats from "./writer/WriterStats"
import WriterSkeleton from "./writer/WriterSkeleton"
import AssistantTabs from "./writer/AssistantTabs"
import { useResizable } from "./writer/useResizable"
import { useToast } from "@/lib/ui/useToast"
import { useBanner } from "@/lib/ui/useBanner"

export default function CherryWriterModal(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  seedTitle?: string
  seedBody?: string
  onPublish?: (payload: { title: string; body: string; categories: WriterCat[] }) => void
}) {
  const { open, onOpenChange, seedTitle = "", seedBody = "", onPublish } = props

  const [title, setTitle] = useState(seedTitle)
  const [body, setBody] = useState(seedBody)
  const [mode, setMode] = useState<"compose" | "preview" | "split">("compose")
  const [activeCats, setActiveCats] = useState<WriterCat[]>([])

  const [isSaving, setIsSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | undefined>(undefined)

  const resizable = useResizable(320, 260, 560)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const { toast, View: Toast } = useToast()
  const { show, View: Banner } = useBanner()
  const [ready, setReady] = useState(false)

  const onFmt = (cmd: "bold" | "italic" | "link" | "code" | "ul" | "ol" | "quote") => {
    const el = bodyRef.current
    if (!el) return
    const v = el.value
    const s = el.selectionStart ?? 0
    const e = el.selectionEnd ?? 0
    const sel = v.slice(s, e)

    const insert = (text: string) => v.slice(0, s) + text + v.slice(e)
    const wrap = (l: string, r: string = l) => v.slice(0, s) + l + sel + r + v.slice(e)

    let next = v
    let cursorPos = e

    switch (cmd) {
      case "bold":
        next = wrap("**")
        cursorPos = sel ? s + 2 + sel.length + 2 : s + 2
        break
      case "italic":
        next = wrap("_")
        cursorPos = sel ? s + 1 + sel.length + 1 : s + 1
        break
      case "code":
        next = wrap("`")
        cursorPos = sel ? s + 1 + sel.length + 1 : s + 1
        break
      case "link": {
        const text = sel || "text"
        const link = `[${text}](https://)`
        next = insert(link)
        const urlStart = s + 1 + text.length + 2
        cursorPos = urlStart + 8
        break
      }
      case "ul": {
        const block = sel || ""
        const lines = block ? block.split("\n") : [""]
        const bulleted = lines.map(l => (l.startsWith("- ") ? l : `- ${l}`)).join("\n")
        next = insert(bulleted)
        cursorPos = s + 2
        break
      }
      case "ol": {
        const block = sel || ""
        const lines = block ? block.split("\n") : [""]
        const numbered = lines.map((l, i) => (l.match(/^\d+\. /) ? l : `${i + 1}. ${l}`)).join("\n")
        next = insert(numbered)
        cursorPos = s + 3
        break
      }
      case "quote": {
        const block = sel || ""
        const lines = block ? block.split("\n") : [""]
        const quoted = lines.map(l => (l.startsWith("> ") ? l : `> ${l}`)).join("\n")
        next = insert(quoted)
        cursorPos = s + 2
        break
      }
    }

    setBody(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursorPos, cursorPos)
    })
  }

  const onToggleCat = (c: WriterCat) =>
    setActiveCats(xs => (xs.includes(c) ? xs.filter(x => x !== c) : [...xs, c]))

  const onAssistAction = async (type: "assist" | "outline" | "rewrite" | "title", payload?: any) => {
    if (type === "outline") {
      const { bullets } = await getOutline(body)
      setBody(b => b + (b ? "\n\n" : "") + bullets.map((bu:string) => `- ${bu}`).join("\n"))
    }
    if (type === "rewrite") {
      const { body: newBody } = await rewriteApi(body, payload?.tone ?? "concise")
      setBody(newBody)
    }
    if (type === "title") {
      const { titles } = await suggestTitles(body)
      if (titles?.length) setTitle(titles[0])
    }
  }

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => { handleSave() }, 800)
    return () => clearTimeout(t)
  }, [title, body, activeCats, open])

  // Slight delay to avoid FOUC; replace with real loading if present
  useEffect(() => {
    if (!open) { setReady(false); return }
    const t = setTimeout(() => setReady(true), 150)
    return () => { clearTimeout(t); setReady(false) }
  }, [open])

  // Keyboard shortcut: Preview toggle (Cmd/Ctrl+P), guard typing fields
  useEffect(() => {
    if (!open) return
    const shouldIgnore = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName.toLowerCase()
      return tag === "input" || tag === "textarea" || target.isContentEditable
    }
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnore(e.target)) return
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key.toLowerCase() === "p") {
        e.preventDefault()
        const next = mode === "preview" ? "compose" : "preview"
        track("writer_preview_toggle", { from: mode, to: next })
        track("writer_mode_change", { mode: next })
        setMode(next as any)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, mode])

  const publishDisabled = title.trim().length < 3 || body.trim().length < 20
  async function handleSave(){
    setIsSaving(true)
    try{
      const { savedAt: ts } = await saveDraft({ title, body, categories: activeCats })
      setSavedAt(ts ?? Date.now())
      track("writer_save", { len: body.length })
      toast("Saved")
    } catch (err: any) {
      toast("Save failed")
      show(err?.message ?? "Save failed", "error")
    } finally { setIsSaving(false) }
  }

  async function handlePublish(){
    if (title.trim().length < 3 || body.trim().length < 20) return
    try{
      track("writer_publish", { categories: activeCats, length: body.length })
      const { url } = await publishPost({ title, body, categories: activeCats })
      onPublish?.({ title, body, categories: activeCats })
      if (url) {
        try { await navigator.clipboard.writeText(url); toast("Published — link copied") }
        catch { toast("Published") }
      } else {
        toast("Published")
      }
    } catch (e: any) {
      toast("Publish failed")
      show(e?.message ?? "Publish failed", "error")
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1220] text-white">
      {/* Header shell (replace with your dialog header if present) */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="text-sm text-white/80" aria-live="polite">{isSaving ? "Saving..." : savedAt ? "Saved" : ""}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-white/10 px-2 py-1 text-sm hover:bg-white/20 focus-ring"
            onClick={() => {
              const next = mode === "preview" ? "compose" : "preview"
              track("writer_preview_toggle", { from: mode, to: next })
              track("writer_mode_change", { mode: next })
              setMode(next as any)
            }}
          >
            {mode === "preview" ? "Exit Preview" : "Preview (⌘/Ctrl+P)"}
          </button>
          <button
            type="button"
            disabled={publishDisabled}
            className="rounded-md bg-white text-black px-3 py-1 text-sm disabled:opacity-50 focus-ring"
            title={publishDisabled ? "Add a title and a few sentences to publish." : undefined}
            onClick={handlePublish}
          >
            Publish
          </button>
        </div>
      </div>

      {ready ? (
        <>
          <WriterToolbar activeCats={activeCats} onToggleCat={onToggleCat} onFmt={onFmt} />
          <div className="flex min-h-[60vh]">
            <section className="flex-1 p-4">
              <label className="sr-only" htmlFor="writer-title">Title</label>
              <input
                id="writer-title"
                aria-label="Title"
                className="mb-3 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50 focus-ring"
                placeholder="Give it a title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              {mode !== "preview" ? (
                <>
                  <label className="sr-only" htmlFor="writer-body">Body</label>
                  <textarea
                    id="writer-body"
                    name="body"
                    aria-label="Body"
                    ref={bodyRef}
                    className="min-h-[38vh] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/50 focus-ring"
                    placeholder="What’s on your mind?"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <h1 className="text-xl font-semibold">{title || "New Post"}</h1>
                  <pre className="whitespace-pre-wrap text-white/90">{body}</pre>
                </div>
              )}
            </section>

            <div
              role="separator"
              aria-orientation="vertical"
              tabIndex={0}
              className="w-1 cursor-col-resize bg-white/10 hover:bg-white/20"
              onMouseDown={resizable.onDown}
            />
            <div style={{ width: resizable.width }}>
              <AssistantTabs onAction={onAssistAction} />
            </div>
          </div>
          <WriterStats body={body} />
        </>
      ) : (
        <WriterSkeleton />
      )}
      <Toast />
      <Banner />
    </div>
  )
}
