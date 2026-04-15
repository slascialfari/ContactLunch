// GET /.netlify/functions/auth-paypal
// Starts the "Log In with PayPal" OAuth flow for the manager.
// Requires active manager session (must be Google-authed first).

const { verifySession } = require('./utils/auth')
const { getLoginUrl } = require('./utils/paypal')

exports.handler = async (event) => {
  try {
    verifySession(event)
  } catch {
    return { statusCode: 302, headers: { Location: '/.netlify/functions/auth-google' }, body: '' }
  }

  try {
    const url = getLoginUrl('paypal_connect')
    return { statusCode: 302, headers: { Location: url }, body: '' }
  } catch (err) {
    return { statusCode: 500, body: `PayPal OAuth init failed: ${err.message}` }
  }
}
