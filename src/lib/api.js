const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL

async function callAPI(payload) {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Apps Script URL not configured. Set VITE_APPS_SCRIPT_URL in your environment.')
  }

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (data.error) {
    throw new Error(data.error)
  }

  return data
}

export function todayDate() {
  return new Date().toISOString().split('T')[0]
}

export async function getMenu(date = todayDate()) {
  return callAPI({ action: 'getMenu', date })
}

export async function getOrders(date = todayDate()) {
  return callAPI({ action: 'getOrders', date })
}

export async function publishMenu({ date, title, items, price, deadline }) {
  return callAPI({ action: 'publishMenu', date, title, items, price, deadline })
}

export async function createOrder({ date, name, email, dietary, paypalOrderId }) {
  return callAPI({ action: 'createOrder', date, name, email, dietary, paypalOrderId })
}

export async function markCollected({ orderNumber, date }) {
  return callAPI({ action: 'markCollected', orderNumber, date })
}
