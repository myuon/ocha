import { useChat } from '@ai-sdk/react'

export default function AIChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({ api: '/api/ai/chat' })

  return (
    <div style={{ maxWidth: 720, margin: '24px auto' }}>
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 16,
          minHeight: 300,
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m) => (
            <div key={m.id} style={{ display: 'flex' }}>
              <div
                style={{
                  marginLeft: m.role === 'user' ? 'auto' : 0,
                  marginRight: m.role === 'user' ? 0 : 'auto',
                  background: m.role === 'user' ? '#eef2ff' : '#f3f4f6',
                  padding: '8px 12px',
                  borderRadius: 12,
                  maxWidth: '80%'
                }}
              >
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  {m.role === 'user' ? 'You' : 'AI'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ color: '#6b7280', fontSize: 14 }}>Thinking…</div>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me anything…"
          style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }}
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          style={{ padding: '10px 14px', borderRadius: 8, background: '#111827', color: 'white' }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
