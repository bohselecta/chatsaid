export const metadata = { title: "Example Post • ChatSaid" }

export default function ExamplePost() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <article aria-labelledby="post-title" className="prose prose-invert max-w-none">
        <header className="mb-6">
          <h1 id="post-title" className="text-3xl font-bold">Example Post: Hello, ChatSaid</h1>
          <p className="text-sm opacity-70">By Demo User • Today</p>
        </header>
        <section className="space-y-4">
          <p>
            This is a stable demo article used for Lighthouse and E2E audits. It renders a realistic detail
            layout without relying on backend data.
          </p>
          <h2>Why this page exists</h2>
          <ul>
            <li>Catch detail-page regressions (layout, fonts, contrast, CLS).</li>
            <li>Exercise long-form content and headings in audits.</li>
            <li>Keep the URL stable for CI.</li>
          </ul>
          <p>
            You can replace this content later with a real post while keeping the route alive for CI audits.
          </p>
        </section>
      </article>
    </main>
  )
}

