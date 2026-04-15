import { useState, useEffect, useCallback } from 'react'
import { getOrders, markCollected, todayDate, startGoogleLogin } from '../lib/api.js'
import { getMe } from '../lib/api.js'
import { useNavigate } from 'react-router-dom'

export default function CheckInPage() {
  const navigate = useNavigate()

  const [authLoading, setAuthLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  // Auth check
  useEffect(() => {
    getMe()
      .then((me) => {
        setAuthenticated(me.authenticated)
        setAuthLoading(false)
      })
      .catch(() => setAuthLoading(false))
  }, [])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getOrders(todayDate())
      setOrders(Array.isArray(data) ? data : [])
      setLastRefresh(new Date())
    } catch (_) {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authenticated) loadOrders()
  }, [authenticated, loadOrders])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!authenticated) return
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [authenticated, loadOrders])

  async function handleMarkCollected(orderNumber) {
    setOrders((prev) => prev.map((o) => o.orderNumber === orderNumber ? { ...o, collected: true } : o))
    try {
      await markCollected({ orderNumber, date: todayDate() })
    } catch (err) {
      setOrders((prev) => prev.map((o) => o.orderNumber === orderNumber ? { ...o, collected: false } : o))
      alert('Error: ' + err.message)
    }
  }

  const pending   = orders.filter((o) => !o.collected)
  const collected = orders.filter((o) => o.collected)

  if (authLoading) {
    return <div style={styles.centered}><div style={styles.spinner} /></div>
  }

  if (!authenticated) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <p style={styles.loginEyebrow}>Lunch check-in</p>
          <h1 style={styles.loginHeading}>Manager access</h1>
          <p style={styles.loginSub}>Sign in with your manager Google account to open the check-in view.</p>
          <button style={styles.googleBtn} onClick={startGoogleLogin}>
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Check-in</p>
          <h1 style={styles.title}>Lunch Service</h1>
        </div>
        <div style={styles.headerRight}>
          <p style={styles.refreshInfo}>
            {loading ? 'Refreshing…' : lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </p>
          <button style={styles.refreshBtn} onClick={loadOrders} disabled={loading}>↻ Refresh</button>
          <button style={styles.backBtn} onClick={() => navigate('/manager')}>← Dashboard</button>
        </div>
      </header>

      <div style={styles.summaryBar}>
        {[
          { label: 'Total',     value: orders.length,   color: 'var(--chalk)' },
          { label: 'Pending',   value: pending.length,  color: 'var(--amber)' },
          { label: 'Collected', value: collected.length, color: 'var(--green)' },
        ].map(({ label, value, color }, i, arr) => (
          <>
            <div key={label} style={styles.summaryItem}>
              <span style={{ ...styles.summaryNum, color }}>{value}</span>
              <span style={styles.summaryLabel}>{label}</span>
            </div>
            {i < arr.length - 1 && <div key={`d${i}`} style={styles.summaryDivider} />}
          </>
        ))}
      </div>

      <main style={styles.main}>
        {orders.length === 0 && !loading && (
          <div style={styles.empty}><p style={styles.emptyText}>No orders yet.</p></div>
        )}

        {pending.length > 0 && (
          <>
            <h2 style={styles.sectionHeading}>Awaiting collection</h2>
            <div style={styles.grid}>
              {pending.map((order) => (
                <button key={order.orderNumber} style={styles.orderCard} onClick={() => handleMarkCollected(order.orderNumber)}>
                  <span style={styles.cardNum}>{order.orderNumber}</span>
                  <span style={styles.cardName}>{order.name}</span>
                  {order.dietary && <span style={styles.cardDietary}>⚠ {order.dietary}</span>}
                  <span style={styles.cardAction}>Tap to collect</span>
                </button>
              ))}
            </div>
          </>
        )}

        {collected.length > 0 && (
          <>
            <h2 style={{ ...styles.sectionHeading, marginTop: '2rem' }}>Collected</h2>
            <div style={styles.grid}>
              {collected.map((order) => (
                <div key={order.orderNumber} style={{ ...styles.orderCard, ...styles.orderCardDone }}>
                  <span style={{ ...styles.cardNum, color: 'var(--chalk-faint)' }}>{order.orderNumber}</span>
                  <span style={{ ...styles.cardName, color: 'var(--chalk-faint)' }}>{order.name}</span>
                  <span style={styles.doneCheck}>✓ Collected</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

const styles = {
  centered: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loginPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  loginCard: { background: 'var(--bg-card)', border: '1px solid var(--border-amber)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: 360, textAlign: 'center' },
  loginEyebrow: { fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' },
  loginHeading: { fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontStyle: 'italic', color: 'var(--chalk)', marginBottom: '0.75rem' },
  loginSub: { fontFamily: 'var(--font-body)', color: 'var(--chalk-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 },
  googleBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', background: '#fff', color: '#3c4043', border: '1px solid #dadce0', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.95rem', padding: '0.7rem 1.5rem', cursor: 'pointer', width: '100%' },
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.75rem' },
  eyebrow: { fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.15em' },
  title: { fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontStyle: 'italic', color: 'var(--chalk)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  refreshInfo: { fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--chalk-faint)' },
  refreshBtn: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--chalk-muted)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', padding: '0.5rem 0.9rem', cursor: 'pointer' },
  backBtn: { background: 'transparent', border: 'none', color: 'var(--chalk-faint)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer' },
  summaryBar: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' },
  summaryItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' },
  summaryNum: { fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, lineHeight: 1 },
  summaryLabel: { fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--chalk-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  summaryDivider: { width: 1, height: 40, background: 'var(--border)' },
  main: { flex: 1, padding: '1.25rem' },
  empty: { display: 'flex', justifyContent: 'center', padding: '3rem 0' },
  emptyText: { fontFamily: 'var(--font-body)', color: 'var(--chalk-faint)', fontSize: '1rem' },
  sectionHeading: { fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--chalk-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' },
  orderCard: { background: 'var(--bg-card)', border: '1px solid var(--border-amber)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', userSelect: 'none', textAlign: 'center', minHeight: 140, justifyContent: 'center' },
  orderCardDone: { background: 'var(--bg)', border: '1px solid var(--border)', cursor: 'default', opacity: 0.5 },
  cardNum: { fontFamily: 'var(--font-heading)', fontSize: '2.8rem', fontWeight: 700, color: 'var(--amber)', lineHeight: 1 },
  cardName: { fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--chalk)', fontWeight: 500 },
  cardDietary: { fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#e8c438', background: 'rgba(232,196,56,0.1)', borderRadius: 4, padding: '0.1rem 0.4rem' },
  cardAction: { fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--chalk-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.2rem' },
  doneCheck: { fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--green)' },
}
