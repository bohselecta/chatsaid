export const metadata = { title: 'About • ChatSaid' }

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl p-6 text-white">
      <a href="#content" className="sr-only focus:not-sr-only">Skip to content</a>

      <header className="mb-6">
        <nav className="text-sm text-white/60 mb-2" aria-label="Breadcrumb">
          <a href="/canopy" className="hover:underline">Canopy</a>
          <span className="px-2" aria-hidden>／</span>
          <span className="text-white/80">About</span>
        </nav>
        <h1 className="text-3xl font-bold">About ChatSaid</h1>
        <p className="mt-2 text-white/70 max-w-3xl">
          ChatSaid is a place to discover, save, and share AI-powered “cherries” —
          bite-size insights across Funny, Weird, Technical, Research, and Ideas.
        </p>
      </header>

      <section id="content" className="space-y-6">
        <Section title="What is a Cherry?">
          A “cherry” is a small, high-signal post (or bookmark) that can be picked, organized,
          and reviewed later with your docked assistant.
        </Section>

        <Section title="Key Features">
          <ul className="list-disc ml-6 space-y-1">
            <li>Canopy feed with branches and filters</li>
            <li>Pick &amp; manage cherries across categories</li>
            <li>Docked assistant with digests, persona &amp; watchlists</li>
            <li>Explore for trending &amp; discovery</li>
          </ul>
        </Section>

        <Section title="Roadmap Highlights">
          <ul className="list-disc ml-6 space-y-1">
            <li>Live digests &amp; activity feed</li>
            <li>Better onboarding &amp; empty states</li>
            <li>Bot analytics and improved ranking</li>
          </ul>
        </Section>

        <Section title="Contact &amp; Support">
          <p className="text-white/80">
            Questions or feedback? See <a className="underline" href="/help">Help</a> or email
            <a className="underline ml-1" href="mailto:support@chatsaid.com">support@chatsaid.com</a>.
          </p>
        </Section>
      </section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-4">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="text-white/80">{children}</div>
    </section>
  )
}
