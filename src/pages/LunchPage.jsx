import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getMenu, todayDate, createMolliePayment } from '../lib/api.js'
import MenuDisplay from '../components/MenuDisplay.jsx'
import OrderForm from '../components/OrderForm.jsx'
import OrderConfirmation from '../components/OrderConfirmation.jsx'

// Stages: loading | no-menu | closed | form | payment | paying | confirmed | error
export default function LunchPage() {
  const [searchParams] = useSearchParams()
  const [stage, setStage]             = useState('loading')
  const [menu, setMenu]               = useState(null)
  const [guestDetails, setGuestDetails] = useState(null)
  const [errorMsg, setErrorMsg]       = useState('')

  useEffect(() => {
    // Returning from Mollie checkout
    if (searchParams.get('payment') === 'success') {
      const saved = sessionStorage.getItem('cl_guest')
      if (saved) {
        try { setGuestDetails(JSON.parse(saved)) } catch (_) {}
        sessionStorage.removeItem('cl_guest')
      }
      setStage('confirmed')
      return
    }

    async function load() {
      try {
        const data = await getMenu(todayDate())
        if (!data || !data.title) { setStage('no-menu'); return }
        setMenu(data)
        if (data.deadline && new Date() > new Date(data.deadline)) { setStage('closed'); return }
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

  async function handlePay() {
    setStage('paying')
    try {
      // Save guest details to sessionStorage so confirmation page can greet by name
      sessionStorage.setItem('cl_guest', JSON.stringify(guestDetails))
      const checkoutUrl = await createMolliePayment({
        amount:    menu.price,
        date:      todayDate(),
        name:      guestDetails.name,
        email:     guestDetails.email,
        dietary:   guestDetails.dietary || '',
        menuTitle: menu.title,
        menuItems: menu.items,
        price:     menu.price,
      })
      window.location.href = checkoutUrl
    } catch (err) {
      sessionStorage.removeItem('cl_guest')
      setErrorMsg('Payment failed: ' + err.message)
      setStage('error')
    }
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
              <button style={styles.idealBtn} onClick={handlePay}>
                <IdealLogo />
                Pay with iDEAL
              </button>
              <button style={styles.backBtn} onClick={() => setStage('form')}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {stage === 'paying' && (
          <div style={styles.stateBox}>
            <div style={styles.spinner} />
            <p style={styles.stateText}>Redirecting to iDEAL…</p>
          </div>
        )}

        {stage === 'confirmed' && (
          <OrderConfirmation name={guestDetails?.name} menuTitle={menu?.title} />
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

function IdealLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <rect width="40" height="40" rx="6" fill="#CC0066"/>
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
        fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">
        iDEAL
      </text>
    </svg>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { textAlign: 'center', padding: '2.5rem 1rem 1.5rem', borderBottom: '1px solid var(--border)' },
  headerEyebrow: { fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.4rem' },
  headerTitle: { fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontStyle: 'italic', color: 'var(--chalk)', fontWeight: 600 },
  main: { flex: 1, padding: '2rem 1rem', maxWidth: 1040, margin: '0 auto', width: '100%' },
  twoCol: { display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'flex-start' },
  stateBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', textAlign: 'center', padding: '2rem' },
  stateIcon: { fontSize: '2.5rem' },
  stateHeading: { fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--chalk)', fontStyle: 'italic' },
  stateText: { fontFamily: 'var(--font-body)', color: 'var(--chalk-muted)', maxWidth: 340, lineHeight: 1.6 },
  spinner: { width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  closedBanner: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center', maxWidth: 480, width: '100%', margin: '0 auto' },
  closedHeading: { fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--chalk)', marginBottom: '0.5rem' },
  closedText: { fontFamily: 'var(--font-body)', color: 'var(--chalk-muted)', fontSize: '0.9rem', lineHeight: 1.6 },
  paymentBlock: { display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 480, width: '100%' },
  paymentHeading: { fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--chalk)' },
  paymentSub: { fontFamily: 'var(--font-body)', color: 'var(--chalk-muted)', fontSize: '0.9rem' },
  idealBtn: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center',
    background: '#CC0066', color: '#fff', border: 'none', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem',
    padding: '0.85rem 1.5rem', cursor: 'pointer', width: '100%',
  },
  backBtn: { background: 'transparent', border: 'none', color: 'var(--chalk-faint)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer', padding: '0.5rem 0', textAlign: 'left' },
  retryBtn: { marginTop: '0.5rem', background: 'var(--amber)', color: 'var(--bg)', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.95rem', padding: '0.75rem 1.5rem', cursor: 'pointer' },
}
