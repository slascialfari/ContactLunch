// PayPal REST API helpers — server-side order creation, capture, webhook verification.

const IS_SANDBOX  = (process.env.PAYPAL_ENV || 'sandbox') !== 'live'
const PAYPAL_BASE = IS_SANDBOX ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com'

async function getAppAccessToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method:  'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) throw new Error(`PayPal token error: ${data.error_description || res.status}`)
  return data.access_token
}

async function createOrder(amount, meta = {}) {
  const token = await getAppAccessToken()
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount:      { currency_code: 'EUR', value: Number(amount).toFixed(2) },
        description: 'Canteen lunch subscription',
        custom_id:   JSON.stringify(meta),
      }],
      application_context: {
        shipping_preference: 'NO_SHIPPING',
        user_action:         'PAY_NOW',
      },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`PayPal createOrder error: ${JSON.stringify(data)}`)
  return data.id
}

async function captureOrder(orderId) {
  const token = await getAppAccessToken()
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`PayPal capture error: ${JSON.stringify(data)}`)
  return data
}

// Verifies webhook signature via PayPal API.
async function verifyWebhookSignature({ headers, rawBody, webhookId }) {
  const token = await getAppAccessToken()
  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo:         headers['paypal-auth-algo'],
      cert_url:          headers['paypal-cert-url'],
      transmission_id:   headers['paypal-transmission-id'],
      transmission_sig:  headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id:        webhookId,
      webhook_event:     JSON.parse(rawBody),
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Webhook verification error: ${res.status}`)
  return data.verification_status === 'SUCCESS'
}

module.exports = { getAppAccessToken, createOrder, captureOrder, verifyWebhookSignature }
