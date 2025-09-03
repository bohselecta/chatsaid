"use client"

export default function Hero() {
  return (
    <section className="relative rounded-2xl overflow-hidden hero-bg">
      <div className="absolute inset-x-0 -top-6 h-24 desk-cap" aria-hidden />
      <div className="px-6 py-10 md:px-8 md:py-14">
        <h1 className="text-5xl font-bold tracking-tight text-white">A social network for ideas, posts, and discovery</h1>
        <p className="mt-3 text-lg text-white/80">Create posts, discover what’s trending, and organize everything in your own space.</p>
      </div>
    </section>
  )
}

