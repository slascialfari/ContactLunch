// All API calls go to Netlify Functions (same origin in both dev and production).

async function callSheetsAPI(payload) {
  const res = await fetch('/.netlify/functions/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`)
  return data
}

export function todayDate() {
  return new Date().toISOString().split('T')[0]
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function getMe() {
  const res = await fetch('/.netlify/functions/me', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch user status')
  return res.json()
}

export function startGoogleLogin() {
  window.location.href = '/.netlify/functions/auth-google'
}

export function logout() {
  window.location.href = '/.netlify/functions/logout'
}

// ─── Sheets operations ────────────────────────────────────────────────────────

export async function getMenu(date = todayDate()) {
  return callSheetsAPI({ action: 'getMenu', date })
}

export async function getOrders(date = todayDate()) {
  return callSheetsAPI({ action: 'getOrders', date })
}

export async function publishMenu({ date, title, items, price, deadline }) {
  return callSheetsAPI({ action: 'publishMenu', date, title, items, price, deadline })
}

export async function markCollected({ orderNumber, date }) {
  return callSheetsAPI({ action: 'markCollected', orderNumber, date })
}

// ─── Mollie iDEAL checkout ───────────────────────────────────────────────────

export async function createMolliePayment({ amount, date, name, email, dietary, menuTitle, menuItems, price }) {
  const res = await fetch('/.netlify/functions/mollie-create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, date, name, email, dietary, menuTitle, menuItems, price }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create payment')
  return data.checkoutUrl
}
