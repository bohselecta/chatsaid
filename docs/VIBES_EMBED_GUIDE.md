# Vibe Apps — Embed Contract

Remote URL apps load in an iframe and should:
- Post `vibe:ready` when mounted
- Post `vibe:resize` with `{height}` after layout changes
- Accept one-time `vibe:init` with `{props}` from parent

Example (inside your app):

```js
window.parent.postMessage({ type: 'vibe:ready' }, '*')

function sendSize() {
  const h = document.documentElement.scrollHeight
  window.parent.postMessage({ type: 'vibe:resize', height: h }, '*')
}
window.addEventListener('load', sendSize)
new ResizeObserver(sendSize).observe(document.body)

window.addEventListener('message', (ev) => {
  if (ev.data?.type === 'vibe:init') {
    const props = ev.data.props || {}
    // Use props to configure view-only state
  }
})
```

Security in ChatSaid host:
- Iframe `sandbox`: `allow-scripts allow-forms allow-pointer-lock allow-popups allow-downloads`
- Origins: only events from `allowed_origins` are honored
- No cookies/localStorage shared (no `allow-same-origin`)

NPM embed apps should export a default React component receiving props and avoid DOM escapes/storage.

