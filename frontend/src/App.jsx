import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function App() {
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [documents, setDocuments] = useState([])
  const [selectedDocId, setSelectedDocId] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/helloworld`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => setMessage(data.message))
      .catch((err) => setError(err.message))

    loadDocuments()
  }, [])

  function loadDocuments() {
    fetch(`${API_URL}/documents`)
      .then((res) => res.json())
      .then(setDocuments)
      .catch((err) => setUploadError(err.message))
  }

  function handleUpload(event) {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setUploadError(null)
    fetch(`${API_URL}/documents`, { method: 'POST', body: formData })
      .then((res) => {
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
        return res.json()
      })
      .then((doc) => {
        loadDocuments()
        setSelectedDocId(doc.id)
      })
      .catch((err) => setUploadError(err.message))
  }

  return (
    <section id="center">
      <h1>Backend says:</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!error && <p>{message ?? 'Loading...'}</p>}

      <h2>PDF Documents</h2>
      <input type="file" accept="application/pdf" onChange={handleUpload} />
      {uploadError && <p style={{ color: 'red' }}>Error: {uploadError}</p>}

      <ul>
        {documents.map((doc) => (
          <li key={doc.id}>
            <button type="button" onClick={() => setSelectedDocId(doc.id)}>
              {doc.filename}
            </button>
          </li>
        ))}
      </ul>

      {selectedDocId && (
        <iframe
          title="PDF viewer"
          src={`${API_URL}/documents/${selectedDocId}/file`}
          width="100%"
          height="800px"
        />
      )}
    </section>
  )
}

export default App
