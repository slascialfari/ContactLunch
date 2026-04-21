// GET /.netlify/functions/paypal-client-token
// Generates a PayPal client token required to initialise Hosted Fields.

const { getAppAccessToken } = require('./utils/paypal')

const IS_SANDBOX  = (process.env.PAYPAL_ENV || 'sandbox') !== 'live'
const PAYPAL_BASE = IS_SANDBOX ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com'
const HEADERS     = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

exports.handler = async () => {
  try {
    const token = await getAppAccessToken()
    const res   = await fetch(`${PAYPAL_BASE}/v1/identity/generate-token`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept-Language': 'en_US' },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(`Client token error: ${JSON.stringify(data)}`)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ clientToken: data.client_token }) }
  } catch (err) {
    console.error('paypal-client-token error:', err)
    return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: err.message }) }
  }
}
