// GET /.netlify/functions/auth-google-callback
// Handles Google OAuth callback: exchanges code → stores refresh token → sets session cookie.

const { exchangeCode, getUserInfo, refreshAccessToken } = require('./utils/google')
const { ensureSpreadsheet } = require('./utils/sheets')
const { createSessionToken, setSessionCookie } = require('./utils/auth')
const { getConfig, setConfig } = require('./utils/storage')

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
    // Exchange code for tokens
    const tokens      = await exchangeCode(code)
    const accessToken = tokens.access_token
    const refreshToken = tokens.refresh_token

    if (!refreshToken) {
      throw new Error(`No refresh_token returned by Google. Token keys: ${Object.keys(tokens).join(', ')}`)
    }

    // Get user identity
    const userInfo = await getUserInfo(accessToken)

    // Ensure the spreadsheet exists in user's Drive
    const spreadsheetId = await ensureSpreadsheet(accessToken)

    // Persist credentials and spreadsheet ID
    await setConfig({
      googleRefreshToken: refreshToken,
      spreadsheetId,
      googleEmail:  userInfo.email,
      googleSub:    userInfo.sub,
    })

    // Verify the save worked
    const saved = await getConfig()
    if (!saved.googleRefreshToken) {
      throw new Error('setConfig succeeded but googleRefreshToken not found in Blobs after save')
    }

    // Issue session JWT (contains only identity, not the refresh token)
    const sessionToken = createSessionToken({ sub: userInfo.sub, email: userInfo.email })
    const cookie       = setSessionCookie(sessionToken)

    return {
      statusCode: 302,
      headers: {
        Location:   `${getSiteUrl()}/manager`,
        'Set-Cookie': cookie,
      },
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
