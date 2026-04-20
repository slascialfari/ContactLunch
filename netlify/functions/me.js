// GET /.netlify/functions/me
// Returns current auth status and setup completeness.

const { getSession } = require('./utils/auth')

const CORS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}

exports.handler = async (event) => {
  const session = getSession(event)

  const setup = {
    googleConnected: !!(session?.refreshToken),
    sheetsReady:     !!(session?.spreadsheetId),
    paymentReady:    !!(process.env.MOLLIE_API_KEY),
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      authenticated: !!session,
      email:         session?.email || null,
      setup,
    }),
  }
}
