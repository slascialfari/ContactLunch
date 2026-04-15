import { useState } from 'react'

export default function OrderForm({ onSubmit, disabled }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dietary, setDietary] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    onSubmit({ name: name.trim(), email: email.trim(), dietary: dietary.trim() })
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.heading}>Your details</h2>

      <label style={styles.label}>
        Name <span style={styles.req}>*</span>
        <input
          style={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          disabled={disabled}
          autoComplete="name"
        />
      </label>

      <label style={styles.label}>
        Email <span style={styles.req}>*</span>
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={disabled}
          autoComplete="email"
        />
      </label>

      <label style={styles.label}>
        Dietary notes{' '}
        <span style={styles.optional}>(optional)</span>
        <input
          style={styles.input}
          type="text"
          value={dietary}
          onChange={(e) => setDietary(e.target.value)}
          placeholder="Allergies, preferences…"
          disabled={disabled}
        />
      </label>

      {error && <p style={styles.error}>{error}</p>}

      <button type="submit" style={disabled ? { ...styles.btn, ...styles.btnDisabled } : styles.btn} disabled={disabled}>
        Continue to payment →
      </button>
    </form>
  )
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxWidth: 480,
    width: '100%',
    margin: '0 auto',
  },
  heading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.4rem',
    color: 'var(--chalk)',
    marginBottom: '0.25rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    color: 'var(--chalk-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  req: {
    color: 'var(--amber)',
    display: 'inline',
  },
  optional: {
    textTransform: 'none',
    letterSpacing: 0,
    color: 'var(--chalk-faint)',
    fontWeight: 300,
  },
  input: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--chalk)',
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    padding: '0.65rem 0.85rem',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  error: {
    color: '#e07070',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-body)',
  },
  btn: {
    background: 'var(--amber)',
    color: 'var(--bg)',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    fontWeight: 600,
    padding: '0.85rem 1.5rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'background 0.15s',
  },
  btnDisabled: {
    background: 'var(--chalk-faint)',
    cursor: 'not-allowed',
  },
}
