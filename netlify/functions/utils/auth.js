// Session management via JWT in HttpOnly cookie.
// The JWT carries only { sub, email } — no secrets.
// The Google refresh token lives exclusively in Netlify Blobs.

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const COOKIE_NAME = 'cl_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds
const IS_PROD = process.env.CONTEXT === 'production'

function parseCookies(event) {
  const header = event.headers['cookie'] || event.headers['Cookie'] || ''
  return Object.fromEntries(
    header.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
}

function createSessionToken({ sub, email }) {
  return jwt.sign({ sub, email }, JWT_SECRET, { expiresIn: MAX_AGE })
}

function setSessionCookie(token) {
  const flags = [
    `${COOKIE_NAME}=${token}`,
    `Max-Age=${MAX_AGE}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    IS_PROD ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
  return flags
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
}

// Returns { sub, email } or throws if invalid / missing.
function verifySession(event) {
  const cookies = parseCookies(event)
  const token = cookies[COOKIE_NAME]
  if (!token) throw new Error('Not authenticated')
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    throw new Error('Session expired — please log in again')
  }
}

// Returns { sub, email } or null — no throw.
function getSession(event) {
  try {
    return verifySession(event)
  } catch {
    return null
  }
}

module.exports = { createSessionToken, setSessionCookie, clearSessionCookie, verifySession, getSession }
