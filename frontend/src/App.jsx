import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function App() {
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/helloworld`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => setMessage(data.message))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <section id="center">
      <h1>Backend says:</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!error && <p>{message ?? 'Loading...'}</p>}
    </section>
  )
}

export default App
