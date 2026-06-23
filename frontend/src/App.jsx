import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function App() {
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [resumeDoc, setResumeDoc] = useState(null)
  const [documentError, setDocumentError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/helloworld`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => setMessage(data.message))
      .catch((err) => setError(err.message))

    fetch(`${API_URL}/documents`)
      .then((res) => res.json())
      .then((docs) => setResumeDoc(docs[0] ?? null))
      .catch((err) => setDocumentError(err.message))
  }, [])

  return (
    <section id="center">
      <h1>Backend says:</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!error && <p>{message ?? 'Loading...'}</p>}

      <h2>Resume</h2>
      {documentError && <p style={{ color: 'red' }}>Error: {documentError}</p>}
      {resumeDoc && (
        <>
          <p>
            <a href={`${API_URL}/documents/${resumeDoc.id}/file?download=true`} download>
              Download {resumeDoc.filename}
            </a>
          </p>
          <iframe
            title={resumeDoc.filename}
            src={`${API_URL}/documents/${resumeDoc.id}/file`}
            width="100%"
            height="800px"
          />
        </>
      )}
    </section>
  )
}

export default App
