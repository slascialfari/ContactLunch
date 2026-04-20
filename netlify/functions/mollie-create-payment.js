// POST /.netlify/functions/mollie-create-payment
// Creates a Mollie iDEAL payment and returns the checkout URL.
// Guest-facing — no session required.

const { createPayment } = require('./utils/mollie')

const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

function getSiteUrl() {
  return process.env.URL || 'http://localhost:8888'
}

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

  const { amount, date, name, email, dietary, menuTitle, menuItems, price } = payload
  if (!amount || !date || !name || !email) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing required fields' }) }
  }

  try {
    const payment = await createPayment({
      amount,
      description: `Canteen lunch — ${menuTitle || date}`,
      redirectUrl: `${getSiteUrl()}/lunch?payment=success`,
      webhookUrl:  `${getSiteUrl()}/.netlify/functions/mollie-webhook`,
      metadata: {
        date,
        name,
        email,
        dietary:   dietary || '',
        menuTitle: menuTitle || '',
        menuItems: Array.isArray(menuItems) ? menuItems.join(', ') : (menuItems || ''),
        price:     String(price || amount),
      },
    })

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ checkoutUrl: payment._links.checkout.href }),
    }
  } catch (err) {
    console.error('mollie-create-payment error:', err)
    return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: err.message }) }
  }
}
