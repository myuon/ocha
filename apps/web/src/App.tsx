import { useEffect, useState } from 'react'
import AIChat from './components/AIChat'

export default function App() {
  const [message, setMessage] = useState<string>('Loading...')

  useEffect(() => {
    fetch('/api/hello')
      .then((r) => r.json())
      .then((d) => setMessage(d.message))
      .catch(() => setMessage('Could not reach API'))
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Ocha</h1>
      <p>{message}</p>
      <p style={{ color: '#666' }}>React + Vite + TypeScript</p>
      <hr style={{ margin: '24px 0' }} />
      <h2>AI Chat</h2>
      <AIChat />
    </div>
  )
}
