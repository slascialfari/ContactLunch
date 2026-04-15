// GET /.netlify/functions/auth-paypal-callback
// Handles "Log In with PayPal" callback → stores merchant email → redirects to /manager.

const { exchangeOAuthCode, getMerchantInfo } = require('./utils/paypal')
const { setConfig } = require('./utils/storage')

function getSiteUrl() {
  return process.env.URL || 'http://localhost:8888'
}

exports.handler = async (event) => {
  const params = event.queryStringParameters || {}
  const { code, error } = params

  if (error) {
    return { statusCode: 302, headers: { Location: `${getSiteUrl()}/manager?error=paypal_denied` }, body: '' }
  }
  if (!code) {
    return { statusCode: 302, headers: { Location: `${getSiteUrl()}/manager?error=no_paypal_code` }, body: '' }
  }

  try {
    const tokens   = await exchangeOAuthCode(code)
    const merchant = await getMerchantInfo(tokens.access_token)

    await setConfig({
      paypalMerchantEmail: merchant.email,
      paypalMerchantId:    merchant.payerId,
      paypalMerchantName:  merchant.name,
    })

    return {
      statusCode: 302,
      headers: { Location: `${getSiteUrl()}/manager?paypal=connected` },
      body: '',
    }
  } catch (err) {
    console.error('PayPal callback error:', err)
    return {
      statusCode: 302,
      headers: { Location: `${getSiteUrl()}/manager?error=paypal_failed&msg=${encodeURIComponent(err.message)}` },
      body: '',
    }
  }
}
