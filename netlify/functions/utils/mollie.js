// Mollie REST API helpers.

const MOLLIE_BASE = 'https://api.mollie.com/v2'

function getKey() {
  const key = process.env.MOLLIE_API_KEY
  if (!key) throw new Error('MOLLIE_API_KEY env var is not set')
  return key
}

async function createPayment({ amount, description, redirectUrl, webhookUrl, metadata }) {
  const res = await fetch(`${MOLLIE_BASE}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount:      { currency: 'EUR', value: Number(amount).toFixed(2) },
      description,
      redirectUrl,
      webhookUrl,
      metadata,
      method: 'ideal',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Mollie error: ${data.detail || data.title || res.status}`)
  return data
}

async function getPayment(paymentId) {
  const res = await fetch(`${MOLLIE_BASE}/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${getKey()}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Mollie error: ${data.detail || data.title || res.status}`)
  return data
}

module.exports = { createPayment, getPayment }
