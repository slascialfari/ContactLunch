// GET /.netlify/functions/me
// Returns current auth status, setup completeness, and PayPal client config.

const { getSession } = require('./utils/auth')

const CORS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

exports.handler = async (event) => {
  const session = getSession(event)

  const setup = {
    googleConnected: !!(session?.refreshToken),
    sheetsReady:     !!(session?.spreadsheetId),
    paypalConnected: !!(process.env.PAYPAL_CLIENT_ID),
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      authenticated:  !!session,
      email:          session?.email || null,
      setup,
      paypalClientId: process.env.PAYPAL_CLIENT_ID || null,
      paypalEnv:      process.env.PAYPAL_ENV || 'sandbox',
    }),
  }
}
