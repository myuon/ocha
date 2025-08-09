import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/health', (c) => c.json({ ok: true }))
app.get('/api/hello', (c) => c.json({ message: 'Hello from Hono API' }))

const port = Number(process.env.PORT || 3000)
console.log(`API listening on http://localhost:${port}`)
serve({ fetch: app.fetch, port })

