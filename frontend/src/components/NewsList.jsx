import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function NewsList() {
  const [articles, setArticles] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/news`)
      .then((res) => res.json())
      .then(setArticles)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>
  if (articles.length === 0) return <p>Loading articles...</p>

  return (
    <ul className="news-list">
      {articles.map((article) => (
        <li key={article.link}>
          <a href={article.link} target="_blank" rel="noreferrer">
            {article.title}
          </a>
          <span className="news-meta">
            {article.source} · {formatDate(article.published_at)}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default NewsList
