import SkeletonCard from "@/components/canopy/SkeletonCard"

export default function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </section>
  )}

