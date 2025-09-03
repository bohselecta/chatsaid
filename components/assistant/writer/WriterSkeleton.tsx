export default function WriterSkeleton() {
  return (
    <div className="flex min-h-[60vh]">
      <section className="flex-1 p-4">
        <div className="h-9 w-2/3 rounded skel mb-4" />
        <div className="h-32 w-full rounded skel mb-3" />
        <div className="h-6 w-1/2 rounded skel mb-2" />
        <div className="h-6 w-2/3 rounded skel mb-2" />
        <div className="h-6 w-5/6 rounded skel" />
      </section>
      <div role="separator" aria-orientation="vertical" className="w-1 bg-white/10" />
      <aside className="w-[320px] shrink-0 border-l border-white/10 p-4">
        <div className="h-6 w-1/2 rounded skel mb-3" />
        <div className="h-9 w-full rounded skel mb-2" />
        <div className="h-9 w-full rounded skel mb-2" />
        <div className="h-9 w-full rounded skel mb-2" />
      </aside>
    </div>
  )
}

