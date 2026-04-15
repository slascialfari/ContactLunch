export default function OrderConfirmation({ orderNumber, name, menuTitle }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.checkmark}>✓</div>
        <h1 style={styles.heading}>You're on the list!</h1>
        <p style={styles.sub}>
          Your order for <strong style={styles.em}>{menuTitle}</strong> has been confirmed.
        </p>

        <div style={styles.numberBlock}>
          <p style={styles.numberLabel}>Your order number</p>
          <p style={styles.number}>{orderNumber}</p>
        </div>

        <div style={styles.rule} />

        <p style={styles.instructions}>
          At the counter, just say your number.{' '}
          A confirmation has been sent to your email.
        </p>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem 1rem',
  },
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
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(106,170,100,0.15)',
    border: '2px solid var(--green)',
    color: 'var(--green)',
    fontSize: '1.6rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.2rem',
  },
  heading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.9rem',
    fontStyle: 'italic',
    color: 'var(--chalk)',
    marginBottom: '0.5rem',
  },
  sub: {
    fontFamily: 'var(--font-body)',
    color: 'var(--chalk-muted)',
    fontSize: '0.95rem',
    marginBottom: '1.5rem',
  },
  em: {
    color: 'var(--chalk)',
    fontWeight: 500,
  },
  numberBlock: {
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius)',
    padding: '1.2rem',
    marginBottom: '1.5rem',
  },
  numberLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.75rem',
    color: 'var(--chalk-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.3rem',
  },
  number: {
    fontFamily: 'var(--font-heading)',
    fontSize: '4rem',
    fontWeight: 700,
    color: 'var(--amber)',
    lineHeight: 1,
  },
  rule: {
    height: 1,
    background: 'var(--border)',
    margin: '1.5rem 0',
  },
  instructions: {
    fontFamily: 'var(--font-body)',
    color: 'var(--chalk-muted)',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
}
