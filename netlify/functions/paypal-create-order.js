// POST /.netlify/functions/paypal-create-order
// Creates a PayPal order server-side with guest metadata in custom_id.
// Returns { orderId }.

const { createOrder } = require('./utils/paypal')

const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { amount, date, name, email, dietary, menuTitle, menuItems, price } = payload
  if (!amount || !date || !name || !email) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing required fields' }) }
  }

  try {
    const orderId = await createOrder(amount, {
      date, name, email,
      dietary:   dietary || '',
      menuTitle: menuTitle || '',
      menuItems: Array.isArray(menuItems) ? menuItems.join(', ') : (menuItems || ''),
      price:     String(price || amount),
    })
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ orderId }) }
  } catch (err) {
    console.error('paypal-create-order error:', err)
    return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: err.message }) }
  }
}
