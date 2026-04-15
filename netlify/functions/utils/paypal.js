// PayPal REST API helpers.
// Developer credentials come from env vars (set once by developer).
// Merchant email (from "Log In with PayPal") is stored in Blobs.

const IS_SANDBOX = (process.env.PAYPAL_ENV || 'sandbox') !== 'live'
const PAYPAL_BASE = IS_SANDBOX ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com'
const PAYPAL_AUTH_BASE = IS_SANDBOX ? 'https://www.sandbox.paypal.com' : 'https://www.paypal.com'

const CLIENT_ID     = process.env.PAYPAL_CLIENT_ID
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET

function getSiteUrl() {
  return process.env.URL || 'http://localhost:8888'
}

function getRedirectUri() {
  return `${getSiteUrl()}/.netlify/functions/auth-paypal-callback`
}

// ─── App-level access token (client credentials grant) ───────────────────────

async function getAppAccessToken() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) throw new Error(`PayPal token error: ${data.error_description || res.status}`)
  return data.access_token
}

// ─── Order creation / capture ─────────────────────────────────────────────────

async function createOrder(amount, merchantEmail) {
  const token = await getAppAccessToken()
  const body  = {
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'EUR',
        value: Number(amount).toFixed(2),
      },
      description: 'Canteen lunch subscription',
      ...(merchantEmail ? { payee: { email_address: merchantEmail } } : {}),
    }],
  }
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`PayPal createOrder error: ${JSON.stringify(data)}`)
  return data.id // PayPal order ID
}

async function captureOrder(orderId) {
  const token = await getAppAccessToken()
  const res   = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`PayPal capture error: ${JSON.stringify(data)}`)
  return data
}

// ─── "Log In with PayPal" OAuth ──────────────────────────────────────────────

function getLoginUrl(state = '') {
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    response_type: 'code',
    scope:         'email openid profile',
    redirect_uri:  getRedirectUri(),
    state,
  })
  return `${PAYPAL_AUTH_BASE}/signin/authorize?${params}`
}

async function exchangeOAuthCode(code) {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${PAYPAL_BASE}/v1/identity/openidconnect/tokenservice`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type:   'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) throw new Error(`PayPal OAuth error: ${data.error_description || res.status}`)
  return data // { access_token, refresh_token, id_token, ... }
}

async function getMerchantInfo(accessToken) {
  const res = await fetch(`${PAYPAL_BASE}/v1/identity/openidconnect/userinfo/?schema=openid`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`PayPal userinfo error: ${res.status}`)
  // Returns: { sub (payer_id), email, name, ... }
  return {
    email:    data.email,
    payerId:  data.payer_id || data.sub,
    name:     data.name || '',
  }
}

module.exports = { getAppAccessToken, createOrder, captureOrder, getLoginUrl, exchangeOAuthCode, getMerchantInfo }
