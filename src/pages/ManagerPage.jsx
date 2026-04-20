import { useState, useEffect, useCallback } from 'react'
import { getMenu, getOrders, publishMenu, todayDate, startGoogleLogin, logout } from '../lib/api.js'
import { getMe } from '../lib/api.js'
import QRCodeDisplay from '../components/QRCodeDisplay.jsx'
import SetupBanner from '../components/SetupBanner.jsx'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ManagerPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [loading, setLoading]     = useState(true)
  const [me, setMe]               = useState(null)   // from /me endpoint
  const [tab, setTab]             = useState('menu')

  // Menu form
  const [menuTitle, setMenuTitle]     = useState('')
  const [menuItems, setMenuItems]     = useState('')
  const [menuPrice, setMenuPrice]     = useState('')
  const [menuDeadline, setMenuDeadline] = useState('')
  const [publishing, setPublishing]   = useState(false)
  const [publishMsg, setPublishMsg]   = useState('')
  const [existingMenu, setExistingMenu] = useState(null)

  // Orders
  const [orders, setOrders]               = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // URL error/success params
  const urlError   = searchParams.get('error')
  const urlMsg     = searchParams.get('msg')
  const urlSuccess = searchParams.get('paypal')

  // ── Auth check on mount ──────────────────────────────────────────────────
  useEffect(() => {
    getMe()
      .then((data) => {
        setMe(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // ── Load today's menu when authed ────────────────────────────────────────
  const loadTodayMenu = useCallback(async () => {
    try {
      const m = await getMenu(todayDate())
      if (m && m.title) {
        setExistingMenu(m)
        setMenuTitle(m.title)
        setMenuItems(Array.isArray(m.items) ? m.items.join('\n') : m.items)
        setMenuPrice(String(m.price))
        setMenuDeadline(m.deadline ? m.deadline.slice(0, 16) : '')
      }
    } catch (_) {}
  }, [])

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const data = await getOrders(todayDate())
      setOrders(Array.isArray(data) ? data : [])
    } catch (_) { setOrders([]) }
    finally { setOrdersLoading(false) }
  }, [])

  useEffect(() => {
    if (me?.authenticated) loadTodayMenu()
  }, [me, loadTodayMenu])

  useEffect(() => {
    if (me?.authenticated && tab === 'orders') loadOrders()
  }, [me, tab, loadOrders])

  async function handlePublish(e) {
    e.preventDefault()
    setPublishing(true)
    setPublishMsg('')
    try {
      const items = menuItems.split('\n').map((s) => s.trim()).filter(Boolean)
      await publishMenu({
        date:     todayDate(),
        title:    menuTitle.trim(),
        items,
        price:    parseFloat(menuPrice),
        deadline: menuDeadline ? new Date(menuDeadline).toISOString() : '',
      })
      setPublishMsg('✓ Menu published successfully!')
      setExistingMenu({ title: menuTitle, items, price: menuPrice, deadline: menuDeadline })
    } catch (err) {
      setPublishMsg('Error: ' + err.message)
    } finally {
      setPublishing(false)
    }
  }

  // ── Loading splash ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
      </div>
    )
  }

  // ── Not authenticated → Google sign-in screen ────────────────────────────
  if (!me?.authenticated) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <p style={styles.loginEyebrow}>Canteen Manager</p>
          <h1 style={styles.loginHeading}>Sign in to continue</h1>
          <p style={styles.loginSub}>
            Your data lives in your own Google Drive. No passwords to remember.
          </p>
          {urlError && (
            <p style={styles.loginError}>
              {urlError === 'google_denied' && 'Google sign-in was cancelled.'}
              {urlError === 'auth_failed'   && `Authentication failed${urlMsg ? ': ' + urlMsg : ' — please try again.'}`}
              {!['google_denied','auth_failed'].includes(urlError) && `Error: ${urlError}${urlMsg ? ': ' + urlMsg : ''}`}
            </p>
          )}
          <button style={styles.googleBtn} onClick={startGoogleLogin}>
            <GoogleIcon />
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Manager</p>
          <h1 style={styles.title}>Canteen Dashboard</h1>
        </div>
        <div style={styles.headerActions}>
          <span style={styles.userEmail}>{me.email}</span>
          <button style={styles.secondaryBtn} onClick={() => navigate('/checkin')}>
            Check-in View →
          </button>
          <button style={styles.secondaryBtn} onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <div style={styles.tabs}>
        {['menu', 'orders', 'qr'].map((t) => (
          <button
            key={t}
            style={tab === t ? { ...styles.tab, ...styles.tabActive } : styles.tab}
            onClick={() => setTab(t)}
          >
            {t === 'menu'   && 'Publish Menu'}
            {t === 'orders' && "Today's Orders"}
            {t === 'qr'     && 'QR Code'}
          </button>
        ))}
      </div>

      <main style={styles.main}>
        {/* PayPal/setup banner */}
        {urlSuccess === 'connected' && (
          <div style={styles.successBanner}>✓ PayPal connected successfully!</div>
        )}
        <SetupBanner setup={me.setup} />

        {/* ── MENU TAB ── */}
        {tab === 'menu' && (
          <div style={styles.card}>
            <h2 style={styles.cardHeading}>
              {existingMenu ? 'Update' : 'Publish'} Today's Menu
            </h2>
            <p style={styles.cardSub}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <form onSubmit={handlePublish} style={styles.form}>
              <label style={styles.label}>
                Menu title
                <input style={styles.input} value={menuTitle} onChange={(e) => setMenuTitle(e.target.value)} placeholder="e.g. Monday Pasta & Salad" required />
              </label>
              <label style={styles.label}>
                Items <span style={styles.hint}>(one per line)</span>
                <textarea style={{ ...styles.input, ...styles.textarea }} value={menuItems} onChange={(e) => setMenuItems(e.target.value)} placeholder={'Pasta al pomodoro\nInsalata verde\nTiramisu'} rows={5} required />
              </label>
              <div style={styles.row}>
                <label style={{ ...styles.label, flex: 1 }}>
                  Price (€)
                  <input style={styles.input} type="number" step="0.01" min="0" value={menuPrice} onChange={(e) => setMenuPrice(e.target.value)} placeholder="8.50" required />
                </label>
                <label style={{ ...styles.label, flex: 2 }}>
                  Order deadline
                  <input style={styles.input} type="datetime-local" value={menuDeadline} onChange={(e) => setMenuDeadline(e.target.value)} />
                </label>
              </div>
              {publishMsg && (
                <p style={{ ...styles.publishMsg, color: publishMsg.startsWith('✓') ? 'var(--green)' : '#e07070' }}>
                  {publishMsg}
                </p>
              )}
              <button type="submit" style={publishing ? { ...styles.btn, ...styles.btnDisabled } : styles.btn} disabled={publishing}>
                {publishing ? 'Publishing…' : existingMenu ? 'Update Menu' : 'Publish Menu'}
              </button>
            </form>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <div style={styles.card}>
            <div style={styles.ordersHeader}>
              <h2 style={styles.cardHeading}>Today's Subscribers</h2>
              <button style={styles.refreshBtn} onClick={loadOrders}>↻ Refresh</button>
            </div>
            {ordersLoading ? (
              <p style={styles.muted}>Loading…</p>
            ) : orders.length === 0 ? (
              <p style={styles.muted}>No orders yet today.</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>{['#','Name','Email','Dietary notes','Paid','Collected'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.orderNumber} style={styles.tr}>
                        <td style={{ ...styles.td, ...styles.orderNumCell }}>{o.orderNumber}</td>
                        <td style={styles.td}>{o.name}</td>
                        <td style={{ ...styles.td, ...styles.emailCell }}>{o.email}</td>
                        <td style={styles.td}>{o.dietary || '—'}</td>
                        <td style={styles.td}><span style={o.paid ? styles.badgeGreen : styles.badgeGray}>{o.paid ? 'Paid' : 'Pending'}</span></td>
                        <td style={styles.td}><span style={o.collected ? styles.badgeGreen : styles.badgeGray}>{o.collected ? 'Collected' : '—'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p style={{ ...styles.muted, marginTop: '0.75rem', fontSize: '0.8rem' }}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} today
            </p>
          </div>
        )}

        {/* ── QR TAB ── */}
        {tab === 'qr' && (
          <div style={styles.card}>
            <h2 style={styles.cardHeading}>Permanent QR Code</h2>
            <p style={{ ...styles.cardSub, marginBottom: '1.5rem' }}>
              Print this once and stick it on the wall. It always points to today's menu.
            </p>
            <QRCodeDisplay />
          </div>
        )}
      </main>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

const styles = {
  centered: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loginPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  loginCard: { background: 'var(--bg-card)', border: '1px solid var(--border-amber)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: 400, textAlign: 'center' },
  loginEyebrow: { fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' },
  loginHeading: { fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontStyle: 'italic', color: 'var(--chalk)', marginBottom: '0.75rem' },
  loginSub: { fontFamily: 'var(--font-body)', color: 'var(--chalk-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 },
  loginError: { color: '#e07070', fontSize: '0.85rem', fontFamily: 'var(--font-body)', marginBottom: '1rem' },
  googleBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center',
    background: '#fff', color: '#3c4043', border: '1px solid #dadce0', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.95rem', padding: '0.7rem 1.5rem',
    cursor: 'pointer', width: '100%',
  },
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap', gap: '1rem',
  },
  eyebrow: { fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.2rem' },
  title: { fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontStyle: 'italic', color: 'var(--chalk)' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  userEmail: { fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--chalk-faint)' },
  secondaryBtn: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--chalk-muted)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', padding: '0.5rem 1rem', cursor: 'pointer' },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 1.5rem' },
  tab: { background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--chalk-muted)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', padding: '0.75rem 1rem', cursor: 'pointer' },
  tabActive: { color: 'var(--amber)', borderBottom: '2px solid var(--amber)' },
  main: { flex: 1, padding: '1.5rem', maxWidth: 900, width: '100%' },
  successBanner: { background: 'rgba(106,170,100,0.12)', border: '1px solid var(--green)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--green)' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' },
  cardHeading: { fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--chalk)', marginBottom: '0.25rem' },
  cardSub: { fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--chalk-faint)', marginBottom: '1.25rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.35rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--chalk-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  hint: { textTransform: 'none', letterSpacing: 0, color: 'var(--chalk-faint)', fontWeight: 300 },
  input: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--chalk)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', padding: '0.6rem 0.8rem', outline: 'none', width: '100%' },
  textarea: { resize: 'vertical', lineHeight: 1.6 },
  row: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  publishMsg: { fontFamily: 'var(--font-body)', fontSize: '0.9rem' },
  btn: { background: 'var(--amber)', color: 'var(--bg)', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.95rem', padding: '0.75rem 1.5rem', cursor: 'pointer', alignSelf: 'flex-start' },
  btnDisabled: { background: 'var(--chalk-faint)', cursor: 'not-allowed' },
  ordersHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  refreshBtn: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--chalk-muted)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', padding: '0.4rem 0.8rem', cursor: 'pointer' },
  muted: { fontFamily: 'var(--font-body)', color: 'var(--chalk-faint)', fontSize: '0.9rem' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '0.9rem' },
  th: { textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--chalk-faint)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '0.65rem 0.75rem', color: 'var(--chalk-muted)', verticalAlign: 'middle' },
  orderNumCell: { fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--amber)', fontWeight: 700 },
  emailCell: { fontSize: '0.8rem' },
  badgeGreen: { background: 'rgba(106,170,100,0.15)', color: 'var(--green)', borderRadius: 4, padding: '0.15rem 0.5rem', fontSize: '0.8rem' },
  badgeGray: { background: 'var(--bg-elevated)', color: 'var(--chalk-faint)', borderRadius: 4, padding: '0.15rem 0.5rem', fontSize: '0.8rem' },
}
