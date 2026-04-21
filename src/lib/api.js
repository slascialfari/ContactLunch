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

export async function getMe() {
  const res = await fetch('/.netlify/functions/me', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch user status')
  return res.json()
}

export function startGoogleLogin() { window.location.href = '/.netlify/functions/auth-google' }
export function logout()           { window.location.href = '/.netlify/functions/logout' }

export async function getMenu(date = todayDate())   { return callSheetsAPI({ action: 'getMenu', date }) }
export async function getOrders(date = todayDate()) { return callSheetsAPI({ action: 'getOrders', date }) }
export async function publishMenu(p)                { return callSheetsAPI({ action: 'publishMenu', ...p }) }
export async function markCollected(p)              { return callSheetsAPI({ action: 'markCollected', ...p }) }

export async function getPayPalClientToken() {
  const res = await fetch('/.netlify/functions/paypal-client-token')
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to get client token')
  return data.clientToken
}

export async function createPayPalOrder({ amount, date, name, email, dietary, menuTitle, menuItems, price }) {
  const res = await fetch('/.netlify/functions/paypal-create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, date, name, email, dietary, menuTitle, menuItems, price }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create PayPal order')
  return data.orderId
}

export async function capturePayPalOrder(paypalOrderId) {
  const res = await fetch('/.netlify/functions/paypal-capture-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paypalOrderId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Capture failed')
  return data
}

export async function checkOrderStatus(paypalOrderId) {
  const res = await fetch(`/.netlify/functions/paypal-check-order?paypalOrderId=${encodeURIComponent(paypalOrderId)}`)
  const data = await res.json()
  return data // { found, orderNumber }
}
