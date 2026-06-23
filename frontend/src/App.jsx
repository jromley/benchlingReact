import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function App() {
  const [resumeDoc, setResumeDoc] = useState(null)
  const [documentError, setDocumentError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/documents`)
      .then((res) => res.json())
      .then((docs) => setResumeDoc(docs[0] ?? null))
      .catch((err) => setDocumentError(err.message))
  }, [])

  return (
    <div id="top">
      <Navbar />

      <main>
        <section id="about">
          <h2>About Me</h2>
          <p>
            Placeholder bio — add a paragraph here about your background,
            interests, and what you're looking for.
          </p>
        </section>

        <section id="resume">
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

        <section id="ai-integration">
          <h2>AI Integration</h2>
          <p>TBD</p>
        </section>

        <section id="contact">
          <h2>Contact</h2>
          <p>Placeholder — add your email and/or social links here.</p>
        </section>
      </main>
    </div>
  )
}

export default App
