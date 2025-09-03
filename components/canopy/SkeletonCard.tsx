export default function SkeletonCard() {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="h-5 w-2/3 rounded skel mb-3" />
      <div className="h-3 w-full rounded skel mb-2" />
      <div className="h-3 w-5/6 rounded skel mb-2" />
      <div className="h-3 w-3/4 rounded skel mb-4" />
      <div className="flex gap-2">
        <div className="h-7 w-16 rounded skel" />
        <div className="h-7 w-16 rounded skel" />
      </div>
    </article>
  )
}

