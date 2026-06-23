const NAV_LINKS = [
  { href: '#about', label: 'About Me' },
  { href: '#resume', label: 'Resume' },
  { href: '#ai-integration', label: 'AI Integration' },
  { href: '#contact', label: 'Contact' },
]

function Navbar() {
  return (
    <nav className="navbar">
      <a className="navbar-name" href="#top">
        Josh Romley
      </a>
      <ul className="navbar-links">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navbar
