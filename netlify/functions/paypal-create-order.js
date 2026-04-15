// POST /.netlify/functions/paypal-create-order
// Creates a PayPal order server-side so the amount can't be tampered on the client.
// Returns: { orderId }  — used by the PayPal JS SDK on the frontend.
// No session required (called during guest checkout).

const { createOrder } = require('./utils/paypal')
const { getConfig } = require('./utils/storage')

const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { amount } = payload
  if (!amount || isNaN(Number(amount))) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing or invalid amount' }) }
  }

  try {
    const config      = await getConfig()
    const merchantEmail = config.paypalMerchantEmail || null
    const orderId     = await createOrder(amount, merchantEmail)

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ orderId }),
    }
  } catch (err) {
    console.error('paypal-create-order error:', err)
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
