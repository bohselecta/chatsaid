export const metadata = { title: 'Help • ChatSaid' }

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl p-6 text-white">
      <a href="#content" className="sr-only focus:not-sr-only">Skip to content</a>

      <header className="mb-6">
        <nav className="text-sm text-white/60 mb-2" aria-label="Breadcrumb">
          <a href="/canopy" className="hover:underline">Canopy</a>
          <span className="px-2" aria-hidden>／</span>
          <span className="text-white/80">Help</span>
        </nav>
        <h1 className="text-3xl font-bold">Help &amp; Shortcuts</h1>
        <p className="mt-2 text-white/70 max-w-3xl">
          Quick answers, keyboard shortcuts, and tips for getting the most out of ChatSaid.
        </p>
      </header>

      <div id="content" className="grid gap-4 md:grid-cols-2">
        <Card title="Getting Started">
          <ol className="list-decimal ml-6 space-y-1">
            <li>Browse the Canopy and pick cherries you like.</li>
            <li>Open the Docked Assistant for digests &amp; settings.</li>
            <li>Use Explore to discover trending content.</li>
          </ol>
        </Card>

        <Card title="Keyboard Shortcuts">
          <ul className="list-disc ml-6 space-y-1">
            <li><kbd className="rounded bg-white/10 px-1">/</kbd> Focus search</li>
            <li><kbd className="rounded bg-white/10 px-1">Esc</kbd> Close dock or menus</li>
            <li><kbd className="rounded bg-white/10 px-1">g</kbd> then <kbd className="rounded bg-white/10 px-1">c</kbd> Go to Canopy</li>
          </ul>
        </Card>

        <Card title="Common Questions">
          <details>
            <summary className="cursor-pointer">What is a “cherry”?</summary>
            <p className="mt-2 text-white/80">
              A cherry is a compact, high-signal post or bookmark you can save and organize.
            </p>
          </details>
          <details className="mt-2">
            <summary className="cursor-pointer">How do I use the Docked Assistant?</summary>
            <p className="mt-2 text-white/80">
              Use the launcher at the bottom-right to open the assistant for digests, persona settings,
              and watchlists.
            </p>
          </details>
        </Card>

        <Card title="Contact">
          <p className="text-white/80">
            Need help? Email <a className="underline" href="mailto:support@chatsaid.com">support@chatsaid.com</a>.
          </p>
        </Card>
      </div>
    </main>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-4">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div>{children}</div>
    </section>
  )
}

