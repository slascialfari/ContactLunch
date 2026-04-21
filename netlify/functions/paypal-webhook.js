// POST /.netlify/functions/paypal-webhook
// Receives PAYMENT.CAPTURE.COMPLETED from PayPal.
// Verifies signature, writes order to Sheets, sends confirmation email.

const { verifyWebhookSignature } = require('./utils/paypal')
const { refreshAccessToken }     = require('./utils/google')
const { ensureSpreadsheet, createOrder, markEmailSent } = require('./utils/sheets')
const { sendOrderConfirmation }  = require('./utils/gmail')
const { getConfig }              = require('./utils/storage')

const HEADERS = { 'Content-Type': 'application/json' }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: '' }
  }

  const rawBody   = event.body || ''
  const webhookId = process.env.PAYPAL_WEBHOOK_ID

  // Verify signature when webhook ID is configured
  if (webhookId) {
    try {
      const valid = await verifyWebhookSignature({ headers: event.headers, rawBody, webhookId })
      if (!valid) {
        console.warn('paypal-webhook: invalid signature')
        return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid signature' }) }
      }
    } catch (err) {
      console.warn('paypal-webhook: signature verification failed:', err.message)
    }
  }

  let webhookEvent
  try { webhookEvent = JSON.parse(rawBody) } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  if (webhookEvent.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return { statusCode: 200, headers: HEADERS, body: '' }
  }

  const capture      = webhookEvent.resource
  const paypalOrderId = capture?.supplementary_data?.related_ids?.order_id || capture?.id

  // Extract metadata passed via custom_id (set at order creation time)
  let meta = {}
  try { meta = JSON.parse(capture?.custom_id || '{}') } catch {}

  const { date, name, email, dietary, menuTitle, menuItems, price } = meta

  if (!date || !name || !email) {
    console.warn('paypal-webhook: missing metadata in capture', capture?.id)
    return { statusCode: 200, headers: HEADERS, body: '' }
  }

  try {
    const config = await getConfig()
    if (!config.googleRefreshToken) {
      console.error('paypal-webhook: no googleRefreshToken in Blobs')
      return { statusCode: 200, headers: HEADERS, body: '' }
    }

    const accessToken   = await refreshAccessToken(config.googleRefreshToken)
    const spreadsheetId = config.spreadsheetId || await ensureSpreadsheet(accessToken)

    const { orderNumber } = await createOrder(accessToken, spreadsheetId, {
      date, name, email,
      dietary:      dietary || '',
      paypalOrderId: paypalOrderId || capture?.id,
    })

    try {
      await sendOrderConfirmation({
        toEmail:   email,
        toName:    name,
        orderNumber,
        menuTitle: menuTitle || '',
        menuItems: menuItems ? (Array.isArray(menuItems) ? menuItems : menuItems.split(', ')) : [],
        price:     price || '0',
        lunchDate: date,
      })
      await markEmailSent(accessToken, spreadsheetId, { date, orderNumber })
    } catch (emailErr) {
      console.warn('Confirmation email failed:', emailErr.message)
    }
  } catch (err) {
    console.error('paypal-webhook error:', err)
  }

  return { statusCode: 200, headers: HEADERS, body: '' }
}
