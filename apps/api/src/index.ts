import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const app = new Hono()

app.get('/health', (c) => c.json({ ok: true }))
app.get('/api/hello', (c) => c.json({ message: 'Hello from Hono API' }))

// AI chat endpoint (streams responses)
app.post('/api/ai/chat', async (c) => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return c.json({ error: 'OPENAI_API_KEY is not set' }, 500)
  }

  const { messages } = await c.req.json()
  const openai = createOpenAI({ apiKey })

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages,
  })

  // useChat expects the AI SDK data stream response
  // Prefer toDataStreamResponse when available
  // @ts-ignore - depending on SDK version, this exists
  if (typeof (result as any).toDataStreamResponse === 'function') {
    return (result as any).toDataStreamResponse()
  }
  // Fallback: text stream response
  return (result as any).toTextStreamResponse()
})

// Serve frontend build (production)
// assets under dist/public (copied during build)
app.use('/assets/*', serveStatic({ root: './dist/public' }))
// SPA fallback for any non-API route
app.get('*', serveStatic({ path: './dist/public/index.html' }))

const port = Number(process.env.PORT || 3000)
console.log(`API listening on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
