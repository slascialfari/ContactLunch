// GET /.netlify/functions/auth-google-callback
// Exchanges OAuth code → stores refresh token in Blobs (for guest checkout) + JWT cookie (for manager).

const { exchangeCode, getUserInfo } = require('./utils/google')
const { ensureSpreadsheet } = require('./utils/sheets')
const { createSessionToken, setSessionCookie } = require('./utils/auth')
const { setConfig } = require('./utils/storage')

function getSiteUrl() {
  return process.env.URL || 'http://localhost:8888'
}

exports.handler = async (event) => {
  const params = event.queryStringParameters || {}
  const { code, error } = params

  if (error) {
    return { statusCode: 302, headers: { Location: `${getSiteUrl()}/manager?error=google_denied` }, body: '' }
  }
  if (!code) {
    return { statusCode: 302, headers: { Location: `${getSiteUrl()}/manager?error=no_code` }, body: '' }
  }

  try {
    const tokens = await exchangeCode(code)
    const accessToken  = tokens.access_token
    const refreshToken = tokens.refresh_token

    if (!refreshToken) {
      throw new Error('Google did not return a refresh token. Please revoke app access at myaccount.google.com/permissions and try again.')
    }

    const userInfo      = await getUserInfo(accessToken)
    const spreadsheetId = await ensureSpreadsheet(accessToken)

    // Persist to Blobs so guest checkout (PayPal capture) can access Google Sheets.
    await setConfig({ googleRefreshToken: refreshToken, spreadsheetId })

    // Also embed in JWT cookie for manager API calls (no Blobs read needed per-request).
    const sessionToken = createSessionToken({
      sub: userInfo.sub,
      email: userInfo.email,
      refreshToken,
      spreadsheetId,
    })
    const cookie = setSessionCookie(sessionToken)

    return {
      statusCode: 302,
      headers: { Location: `${getSiteUrl()}/manager`, 'Set-Cookie': cookie },
      body: '',
    }
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return {
      statusCode: 302,
      headers: { Location: `${getSiteUrl()}/manager?error=auth_failed&msg=${encodeURIComponent(err.message)}` },
      body: '',
    }
  }
}
