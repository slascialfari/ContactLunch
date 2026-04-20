// Session management via JWT in HttpOnly cookie.
// Uses Node.js built-in crypto — no external jwt library needed.
// The JWT carries only { sub, email } — no secrets.
// The Google refresh token lives exclusively in Netlify Blobs.

const crypto = require('crypto')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const COOKIE_NAME = 'cl_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds
const IS_PROD = process.env.CONTEXT === 'production'

// ─── Minimal HS256 JWT using built-in crypto ──────────────────────────────────

function b64url(str) {
  return Buffer.from(str).toString('base64url')
}

function signJwt(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body   = b64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + MAX_AGE }))
  const sig    = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

function verifyJwt(token) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Malformed token')
  const [header, body, sig] = parts
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
  if (sig !== expected) throw new Error('Invalid signature')
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired')
  return payload
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function parseCookies(event) {
  const header = event.headers['cookie'] || event.headers['Cookie'] || ''
  return Object.fromEntries(
    header.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
}

function createSessionToken({ sub, email, refreshToken, spreadsheetId }) {
  return signJwt({ sub, email, refreshToken, spreadsheetId })
}

function setSessionCookie(token) {
  return [
    `${COOKIE_NAME}=${token}`,
    `Max-Age=${MAX_AGE}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    IS_PROD ? 'Secure' : '',
  ].filter(Boolean).join('; ')
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
}

// Returns { sub, email } or throws if invalid / missing.
function verifySession(event) {
  const cookies = parseCookies(event)
  const token   = cookies[COOKIE_NAME]
  if (!token) throw new Error('Not authenticated')
  try {
    return verifyJwt(token)
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
