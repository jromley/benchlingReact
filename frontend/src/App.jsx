import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import ContactForm from './components/ContactForm'
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
            I'm a software engineer with a BS in Computer Science from Drexel
            University, concentrated in AI and Human-Computer Interaction. I
            also completed Cogent University's professional Java development
            course and hold an AWS Certified Developer certification.
          </p>
          <p>
            I've built software at companies of all sizes — Comcast, SAS,
            Axis Technology, Zift, and ReverbNation — primarily in Java, with
            plenty of Python, various JavaScript stacks, Bash, PowerShell,
            C#, and Dart/Flutter along the way. I built and published the
            iOS/Android app "Blue Skies" for the non-profit Project Refit,
            and I enjoy taking initiative and mentoring other engineers.
          </p>
          <p>
            Outside of work, I'm an avid traveler and surfer. I treat cooking
            like a fun science experiment — your grade is how tasty what you
            made turns out to be — and I own nearly every cooking tool
            imaginable. I've also raised over 100,000 chickens, and I'm a
            published poet, featured in "Poems for Writing Prompts, 2nd Ed."
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
          <h2>Contact Us</h2>
          <p>
            <a href="https://www.linkedin.com/in/josh-romley-061a435a/" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </p>
          <ContactForm />
        </section>
      </main>
    </div>
  )
}

export default App
