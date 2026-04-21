// GET /.netlify/functions/paypal-check-order?paypalOrderId=xxx
// Polls Sheets to check if an order has been confirmed by the webhook.
// Returns { found: true, orderNumber: '001' } or { found: false }.

const { refreshAccessToken } = require('./utils/google')
const { getSheetRows }       = require('./utils/sheets')
const { getConfig }          = require('./utils/storage')

const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const paypalOrderId = event.queryStringParameters?.paypalOrderId
  if (!paypalOrderId) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing paypalOrderId' }) }
  }

  try {
    const config = await getConfig()
    if (!config.googleRefreshToken) {
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ found: false }) }
    }

    const accessToken   = await refreshAccessToken(config.googleRefreshToken)
    const spreadsheetId = config.spreadsheetId
    if (!spreadsheetId) {
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ found: false }) }
    }

    const rows = await getSheetRows(accessToken, spreadsheetId, 'orders')
    const row  = rows.find((r) => r.paypalOrderId === paypalOrderId)

    if (row) {
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ found: true, orderNumber: row.orderNumber }) }
    }
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ found: false }) }
  } catch (err) {
    console.error('paypal-check-order error:', err)
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ found: false }) }
  }
}
