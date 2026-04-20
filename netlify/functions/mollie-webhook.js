// POST /.netlify/functions/mollie-webhook
// Called by Mollie after payment status changes.
// Only acts on 'paid' status — creates the Sheets order and sends confirmation email.

const { getPayment } = require('./utils/mollie')
const { refreshAccessToken } = require('./utils/google')
const { ensureSpreadsheet, createOrder, markEmailSent } = require('./utils/sheets')
const { sendOrderConfirmation } = require('./utils/gmail')
const { getConfig } = require('./utils/storage')

exports.handler = async (event) => {
  // Mollie sends application/x-www-form-urlencoded with field 'id'
  const params    = new URLSearchParams(event.body || '')
  const paymentId = params.get('id')

  if (!paymentId) return { statusCode: 200, body: '' }

  try {
    const payment = await getPayment(paymentId)

    // Only process confirmed payments
    if (payment.status !== 'paid') return { statusCode: 200, body: '' }

    const { date, name, email, dietary, menuTitle, menuItems, price } = payment.metadata

    // Get Google credentials from Blobs
    const config = await getConfig()
    if (!config.googleRefreshToken) {
      console.error('mollie-webhook: no googleRefreshToken in Blobs')
      return { statusCode: 200, body: '' }
    }

    const accessToken   = await refreshAccessToken(config.googleRefreshToken)
    const spreadsheetId = config.spreadsheetId || await ensureSpreadsheet(accessToken)

    const { orderNumber } = await createOrder(accessToken, spreadsheetId, {
      date,
      name,
      email,
      dietary:      dietary || '',
      paypalOrderId: paymentId, // reusing column to store Mollie payment ID
    })

    try {
      await sendOrderConfirmation({
        toEmail:   email,
        toName:    name,
        orderNumber,
        menuTitle: menuTitle || '',
        menuItems: menuItems ? menuItems.split(', ').filter(Boolean) : [],
        price:     price || '0',
        lunchDate: date,
      })
      await markEmailSent(accessToken, spreadsheetId, { date, orderNumber })
    } catch (emailErr) {
      console.warn('Confirmation email failed (order still created):', emailErr.message)
    }
  } catch (err) {
    console.error('mollie-webhook error:', err)
  }

  // Always return 200 — Mollie retries on non-2xx
  return { statusCode: 200, body: '' }
}
