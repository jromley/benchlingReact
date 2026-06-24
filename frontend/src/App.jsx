import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import ContactForm from './components/ContactForm'
import headshot from './assets/headshot.jpg'
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

      <header className="hero">
        <div className="hero-text">
          <h1>Josh Romley</h1>
          <p className="hero-tagline">
            Full-stack engineer who ships — from cloud infrastructure to apps people actually use.
          </p>
        </div>
        <img className="hero-photo" src={headshot} alt="Josh Romley" />
      </header>

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
            Outside of work, I'm an avid traveler, backpacker, and surfer. 
            I've raised over 100,000 chickens and love cooking. It's like 
            a science experiment where your grade is obvious with the end product. 
            I'm also a published poet, featured in "Poems for Writing Prompts, 2nd Ed."
          </p>
          <p>
            I'm always happy to talk, so please feel free to connect with me on{' '}
            <a href="https://www.linkedin.com/in/josh-romley-061a435a/" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            .
          </p>
        </section>

        <section id="resume">
          <h2>
            Resume
            {resumeDoc && (
              <>
                {' '}
                -{' '}
                <a href={`${API_URL}/documents/${resumeDoc.id}/file?download=true`} download>
                  Download PDF
                </a>
              </>
            )}
          </h2>
          {documentError && <p style={{ color: 'red' }}>Error: {documentError}</p>}
          {resumeDoc && (
            <iframe
              title={resumeDoc.filename}
              src={`${API_URL}/documents/${resumeDoc.id}/file#zoom=75`}
              width="100%"
              height="800px"
            />
          )}
        </section>

        <section id="ai-integration">
          <h2>AI Integration</h2>
          <p>TBD</p>
        </section>

        <section id="contact">
          <h2>Contact Me</h2>
          <ContactForm />
        </section>
      </main>
    </div>
  )
}

export default App
