// POST /.netlify/functions/paypal-capture-order
// Captures a PayPal order, then records the Sheets order and sends confirmation email.
// Returns: { orderNumber }
// No session required (called during guest checkout).

const { captureOrder } = require('./utils/paypal')
const { refreshAccessToken } = require('./utils/google')
const { ensureSpreadsheet, createOrder, markEmailSent } = require('./utils/sheets')
const { sendOrderConfirmation } = require('./utils/gmail')
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

  const { paypalOrderId, date, name, email, dietary, menuTitle, menuItems, price } = payload
  if (!paypalOrderId || !date || !name || !email) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing required fields' }) }
  }

  try {
    // 1. Capture the PayPal payment
    await captureOrder(paypalOrderId)

    // 2. Get stored Google credentials
    const config = await getConfig()
    if (!config.googleRefreshToken) throw new Error('App not set up — manager must sign in first.')

    const accessToken   = await refreshAccessToken(config.googleRefreshToken)
    const spreadsheetId = config.spreadsheetId || await ensureSpreadsheet(accessToken)

    // 3. Record the order in Sheets (email_sent=FALSE until confirmed below)
    const result = await createOrder(accessToken, spreadsheetId, {
      date,
      name,
      email,
      dietary:      dietary || '',
      paypalOrderId,
    })
    const { orderNumber } = result

    // 4. Payment captured and order recorded — respond to guest immediately.
    //    Email runs after, in its own try/catch. Failure is silent: the guest
    //    already has their order number on screen and the manager can see
    //    email_sent=FALSE in the sheet to follow up manually.
    try {
      await sendOrderConfirmation({
        toEmail:    email,
        toName:     name,
        orderNumber,
        menuTitle:  menuTitle || '',
        menuItems:  menuItems || [],
        price:      price || '0',
        lunchDate:  date,
      })
      await markEmailSent(accessToken, spreadsheetId, { date, orderNumber })
    } catch (emailErr) {
      console.warn('Confirmation email failed (order still created):', emailErr.message)
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ orderNumber }),
    }
  } catch (err) {
    console.error('paypal-capture-order error:', err)
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
