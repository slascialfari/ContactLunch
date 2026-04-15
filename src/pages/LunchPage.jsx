import { useEffect, useState } from 'react'
import { getMenu, todayDate } from '../lib/api.js'
import MenuDisplay from '../components/MenuDisplay.jsx'
import OrderForm from '../components/OrderForm.jsx'
import PayPalButton from '../components/PayPalButton.jsx'
import OrderConfirmation from '../components/OrderConfirmation.jsx'

// Stages: loading | no-menu | closed | form | payment | confirmed | error
export default function LunchPage() {
  const [stage, setStage] = useState('loading')
  const [menu, setMenu] = useState(null)
  const [guestDetails, setGuestDetails] = useState(null)
  const [orderNumber, setOrderNumber] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await getMenu(todayDate())
        if (!data || !data.title) {
          setStage('no-menu')
          return
        }
        setMenu(data)

        // Check deadline
        if (data.deadline) {
          const deadline = new Date(data.deadline)
          if (new Date() > deadline) {
            setStage('closed')
            return
          }
        }
        setStage('form')
      } catch (err) {
        setErrorMsg(err.message)
        setStage('error')
      }
    }
    load()
  }, [])

  function handleFormSubmit(details) {
    setGuestDetails(details)
    setStage('payment')
  }

  // orderNumber is returned by paypal-capture-order after server-side capture + Sheets write
  function handlePaymentSuccess(orderNumber) {
    setOrderNumber(orderNumber)
    setStage('confirmed')
  }

  function handlePaymentError(err) {
    setErrorMsg('Payment failed: ' + (err?.message || 'unknown error'))
    setStage('error')
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <p style={styles.headerEyebrow}>Today's specials</p>
        <h1 style={styles.headerTitle}>The Daily Lunch</h1>
      </header>

      <main style={styles.main}>
        {stage === 'loading' && (
          <div style={styles.stateBox}>
            <div style={styles.spinner} />
            <p style={styles.stateText}>Checking today's menu…</p>
          </div>
        )}

        {stage === 'no-menu' && (
          <div style={styles.stateBox}>
            <p style={styles.stateIcon}>🍽️</p>
            <h2 style={styles.stateHeading}>No lunch service today</h2>
            <p style={styles.stateText}>Check back tomorrow — we'll have something good.</p>
          </div>
        )}

        {stage === 'closed' && menu && (
          <div style={styles.stateBox}>
            <MenuDisplay menu={menu} />
            <div style={{ ...styles.closedBanner, marginTop: '1.5rem' }}>
              <p style={styles.closedHeading}>Subscriptions are closed</p>
              <p style={styles.closedText}>
                The ordering window has passed. Come by the canteen and order directly!
              </p>
            </div>
          </div>
        )}

        {stage === 'form' && menu && (
          <div style={styles.twoCol}>
            <MenuDisplay menu={menu} />
            <OrderForm onSubmit={handleFormSubmit} />
          </div>
        )}

        {stage === 'payment' && menu && (
          <div style={styles.twoCol}>
            <MenuDisplay menu={menu} />
            <div style={styles.paymentBlock}>
              <h2 style={styles.paymentHeading}>Complete your order</h2>
              <p style={styles.paymentSub}>
                Paying <strong style={{ color: 'var(--amber)' }}>€{Number(menu.price).toFixed(2)}</strong> for{' '}
                <strong>{guestDetails?.name}</strong>
              </p>
              <PayPalButton
                menu={menu}
                guestDetails={guestDetails}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
              <button style={styles.backBtn} onClick={() => setStage('form')}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {stage === 'confirmed' && (
          <OrderConfirmation
            orderNumber={orderNumber}
            name={guestDetails?.name}
            menuTitle={menu?.title}
          />
        )}

        {stage === 'error' && (
          <div style={styles.stateBox}>
            <p style={styles.stateIcon}>⚠️</p>
            <h2 style={{ ...styles.stateHeading, color: '#e07070' }}>Something went wrong</h2>
            <p style={styles.stateText}>{errorMsg}</p>
            <button style={styles.retryBtn} onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    padding: '2.5rem 1rem 1.5rem',
    borderBottom: '1px solid var(--border)',
  },
  headerEyebrow: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.75rem',
    color: 'var(--amber)',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    marginBottom: '0.4rem',
  },
  headerTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
    fontStyle: 'italic',
    color: 'var(--chalk)',
    fontWeight: 600,
  },
  main: {
    flex: 1,
    padding: '2rem 1rem',
    maxWidth: 1040,
    margin: '0 auto',
    width: '100%',
  },
  twoCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    alignItems: 'flex-start',
    '@media (min-width: 700px)': {
      flexDirection: 'row',
    },
  },
  stateBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    minHeight: '40vh',
    textAlign: 'center',
    padding: '2rem',
  },
  stateIcon: { fontSize: '2.5rem' },
  stateHeading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.6rem',
    color: 'var(--chalk)',
    fontStyle: 'italic',
  },
  stateText: {
    fontFamily: 'var(--font-body)',
    color: 'var(--chalk-muted)',
    maxWidth: 340,
    lineHeight: 1.6,
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid var(--border)',
    borderTopColor: 'var(--amber)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  closedBanner: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    textAlign: 'center',
    maxWidth: 480,
    width: '100%',
    margin: '0 auto',
  },
  closedHeading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.3rem',
    color: 'var(--chalk)',
    marginBottom: '0.5rem',
  },
  closedText: {
    fontFamily: 'var(--font-body)',
    color: 'var(--chalk-muted)',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  paymentBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxWidth: 480,
    width: '100%',
  },
  paymentHeading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.4rem',
    color: 'var(--chalk)',
  },
  paymentSub: {
    fontFamily: 'var(--font-body)',
    color: 'var(--chalk-muted)',
    fontSize: '0.9rem',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--chalk-faint)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '0.5rem 0',
    textAlign: 'left',
  },
  retryBtn: {
    marginTop: '0.5rem',
    background: 'var(--amber)',
    color: 'var(--bg)',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '0.95rem',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
  },
}
