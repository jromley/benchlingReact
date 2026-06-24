import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function ChatWidget() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()
    if (!input.trim() || sending) return

    const nextMessages = [...messages, { role: 'user', content: input }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)
    setError(null)

    fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: nextMessages }),
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 429) throw new Error("You've reached the chat limit for now, try again later.")
          throw new Error(`Request failed: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      })
      .catch((err) => setError(err.message))
      .finally(() => setSending(false))
  }

  return (
    <div className="chat-widget">
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-placeholder">Ask me anything about Josh's background and experience.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-message chat-message-${m.role}`}>
            {m.content}
          </div>
        ))}
        {sending && <div className="chat-message chat-message-assistant">...</div>}
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} className="chat-input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatWidget
