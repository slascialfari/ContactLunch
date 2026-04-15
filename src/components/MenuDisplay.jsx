export default function MenuDisplay({ menu }) {
  const items = Array.isArray(menu.items)
    ? menu.items
    : String(menu.items).split(',').map((s) => s.trim()).filter(Boolean)

  return (
    <div style={styles.board}>
      {/* Decorative chalk rule top */}
      <div style={styles.rule} />

      <p style={styles.dateLabel}>
        {new Date().toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </p>

      <h1 style={styles.title}>{menu.title}</h1>

      <div style={styles.rule} />

      <ul style={styles.itemList}>
        {items.map((item, i) => (
          <li key={i} style={styles.item}>
            <span style={styles.bullet}>✦</span>
            {item}
          </li>
        ))}
      </ul>

      <div style={styles.rule} />

      <div style={styles.priceRow}>
        <span style={styles.priceLabel}>Today's price</span>
        <span style={styles.price}>€{Number(menu.price).toFixed(2)}</span>
      </div>

      {menu.deadline && (
        <p style={styles.deadline}>
          Order by{' '}
          <strong>
            {new Date(menu.deadline).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </strong>
        </p>
      )}
    </div>
  )
}

const styles = {
  board: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-amber)',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    maxWidth: 480,
    width: '100%',
    margin: '0 auto',
  },
  rule: {
    height: 1,
    background: 'var(--border-amber)',
    margin: '1rem 0',
    opacity: 0.6,
  },
  dateLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    color: 'var(--amber)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '0.5rem',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '2rem',
    fontStyle: 'italic',
    fontWeight: 600,
    color: 'var(--chalk)',
    lineHeight: 1.2,
  },
  itemList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    padding: 0,
    margin: '0.5rem 0',
  },
  item: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.6rem',
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    color: 'var(--chalk-muted)',
  },
  bullet: {
    color: 'var(--amber)',
    fontSize: '0.6rem',
    flexShrink: 0,
    marginTop: 2,
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  priceLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    color: 'var(--chalk-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  price: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.8rem',
    fontWeight: 700,
    color: 'var(--amber)',
  },
  deadline: {
    marginTop: '0.75rem',
    fontSize: '0.85rem',
    color: 'var(--chalk-muted)',
    textAlign: 'center',
  },
}
