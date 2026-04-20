// GET /.netlify/functions/me
// Returns current auth status, setup completeness, and public config for the frontend.
// Works for both authenticated managers and unauthenticated guests.

const { getSession } = require('./utils/auth')
const { getConfig } = require('./utils/storage')

const CORS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}

exports.handler = async (event) => {
  const session = getSession(event)
  const config  = await getConfig()

  const paypalMerchantEmail = process.env.PAYPAL_MERCHANT_EMAIL || config.paypalMerchantEmail || null

  const setup = {
    googleConnected: !!config.googleRefreshToken,
    sheetsReady:     !!config.spreadsheetId,
    paypalConnected: !!paypalMerchantEmail,
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      authenticated:    !!session,
      email:            session?.email || null,
      setup,
      paypalClientId:   process.env.PAYPAL_CLIENT_ID || null,
      paypalEnv:        process.env.PAYPAL_ENV || 'sandbox',
      paypalMerchantEmail,
    }),
  }
}
