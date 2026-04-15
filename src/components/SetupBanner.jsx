import { startPayPalConnect } from '../lib/api.js'

// Shows first-run setup steps inline in the manager dashboard.
// setup: { googleConnected, sheetsReady, paypalConnected }
export default function SetupBanner({ setup }) {
  const allDone = setup.googleConnected && setup.sheetsReady && setup.paypalConnected

  if (allDone) return null

  return (
    <div style={styles.banner}>
      <h3 style={styles.heading}>First-time setup</h3>
      <p style={styles.sub}>Complete these steps to start accepting orders.</p>

      <div style={styles.steps}>
        <Step
          done={setup.googleConnected && setup.sheetsReady}
          number="1"
          title="Google connected"
          desc="Your account is linked and the Canteen Data spreadsheet has been created in your Google Drive."
        />

        <Step
          done={setup.paypalConnected}
          number="2"
          title="PayPal connected"
          desc="Link your PayPal account so payments route directly to you."
          action={
            !setup.paypalConnected && (
              <button style={styles.connectBtn} onClick={startPayPalConnect}>
                <span style={styles.ppIcon}>P</span>
                Connect with PayPal
              </button>
            )
          }
        />
      </div>
    </div>
  )
}

function Step({ done, number, title, desc, action }) {
  return (
    <div style={styles.step}>
      <div style={done ? { ...styles.stepNum, ...styles.stepNumDone } : styles.stepNum}>
        {done ? '✓' : number}
      </div>
      <div style={styles.stepBody}>
        <p style={done ? { ...styles.stepTitle, ...styles.stepTitleDone } : styles.stepTitle}>{title}</p>
        <p style={styles.stepDesc}>{desc}</p>
        {action}
      </div>
    </div>
  )
}

const styles = {
  banner: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-amber)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  heading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.2rem',
    color: 'var(--chalk)',
    marginBottom: '0.25rem',
  },
  sub: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    color: 'var(--chalk-muted)',
    marginBottom: '1.25rem',
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  step: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--chalk-muted)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumDone: {
    background: 'rgba(106,170,100,0.15)',
    border: '1px solid var(--green)',
    color: 'var(--green)',
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: 'var(--chalk)',
    marginBottom: '0.2rem',
  },
  stepTitleDone: {
    color: 'var(--chalk-muted)',
  },
  stepDesc: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    color: 'var(--chalk-faint)',
    lineHeight: 1.5,
    marginBottom: '0.5rem',
  },
  connectBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#0070ba',
    color: '#ffffff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '0.85rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    marginTop: '0.25rem',
  },
  ppIcon: {
    fontFamily: 'Georgia, serif',
    fontStyle: 'italic',
    fontWeight: 700,
    fontSize: '1rem',
  },
}
