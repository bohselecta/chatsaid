// Lightweight poller: POST to the import endpoint
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
;(async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/social/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    const js = await res.json().catch(()=>({}))
    console.log('[social:poll] status', res.status, js)
    process.exit(0)
  } catch (e) {
    console.error('[social:poll] failed:', e?.message || e)
    process.exit(1)
  }
})()

