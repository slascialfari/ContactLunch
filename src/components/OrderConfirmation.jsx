export default function OrderConfirmation({ name, menuTitle }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.checkmark}>✓</div>
        <h1 style={styles.heading}>Payment received!</h1>
        <p style={styles.sub}>
          {name ? `Thanks ${name}! Your` : 'Your'} order
          {menuTitle ? ` for ${menuTitle}` : ''} is confirmed.
        </p>

        <div style={styles.infoBlock}>
          <p style={styles.infoText}>
            Your order number will arrive in your email confirmation shortly.
            At the counter, just show the email or say your number.
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', padding: '2rem 1rem' },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-amber)',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem 2rem',
    maxWidth: 420,
    width: '100%',
    textAlign: 'center',
  },
  checkmark: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'rgba(106,170,100,0.15)', border: '2px solid var(--green)',
    color: 'var(--green)', fontSize: '1.6rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 1.2rem',
  },
  heading: { fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontStyle: 'italic', color: 'var(--chalk)', marginBottom: '0.5rem' },
  sub: { fontFamily: 'var(--font-body)', color: 'var(--chalk-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' },
  infoBlock: { background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '1.2rem' },
  infoText: { fontFamily: 'var(--font-body)', color: 'var(--chalk-muted)', fontSize: '0.9rem', lineHeight: 1.6 },
}
