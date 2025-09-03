export function EmptyState() {
  return (
    <div role="status" aria-live="polite" className="py-16 text-center text-sm text-black/60 dark:text-white/60">
      No posts match your filters. Try clearing search or toggling categories.
    </div>
  );
}

export function ErrorState() {
  return (
    <div role="alert" className="py-16 text-center text-sm text-red-600">
      Something went wrong loading the canopy. Please retry.
    </div>
  );
}

export function LoadingState() {
  return (
    <div aria-live="polite" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
      ))}
    </div>
  );
}

