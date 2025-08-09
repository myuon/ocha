import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()

app.get('/health', (c) => c.json({ ok: true }))
app.get('/api/hello', (c) => c.json({ message: 'Hello from Hono API' }))

// Serve frontend build (production)
// assets under dist/public (copied during build)
app.use('/assets/*', serveStatic({ root: './dist/public' }))
// SPA fallback for any non-API route
app.get('*', serveStatic({ path: './dist/public/index.html' }))

const port = Number(process.env.PORT || 3000)
console.log(`API listening on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
