// POST /.netlify/functions/paypal-capture-order
// Captures a PayPal order after guest approves in the SDK.
// Does NOT write to Sheets — that happens in paypal-webhook when capture completes.

const { captureOrder } = require('./utils/paypal')

const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { paypalOrderId } = payload
  if (!paypalOrderId) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing paypalOrderId' }) }
  }

  try {
    await captureOrder(paypalOrderId)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ captured: true }) }
  } catch (err) {
    console.error('paypal-capture-order error:', err)
    return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: err.message }) }
  }
}
