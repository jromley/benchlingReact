import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function ContactForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorText, setErrorText] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()
    setStatus('sending')
    setErrorText(null)

    fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, message }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then(() => {
        setStatus('sent')
        setEmail('')
        setMessage('')
      })
      .catch((err) => {
        setStatus('error')
        setErrorText(err.message)
      })
  }

  if (status === 'sent') {
    return <p>Thanks for reaching out! I'll get back to you soon.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <label>
        Your email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        Message
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Send'}
      </button>
      {status === 'error' && <p style={{ color: 'red' }}>Error: {errorText}</p>}
    </form>
  )
}

export default ContactForm
