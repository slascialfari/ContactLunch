// POST /.netlify/functions/api
// Routes all Sheets operations. Uses stored refresh token — no client auth token needed.
// Manager-only actions (publishMenu, getOrders, markCollected) require session cookie.
// Public actions (getMenu) work without a session.

const { verifySession } = require('./utils/auth')
const { refreshAccessToken } = require('./utils/google')
const {
  ensureSpreadsheet,
  getMenu,
  getOrders,
  publishMenu,
  createOrder,
  markCollected,
} = require('./utils/sheets')
const { getConfig } = require('./utils/storage')

const MANAGER_ACTIONS = new Set(['publishMenu', 'getOrders', 'markCollected'])

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}

function ok(data) {
  return { statusCode: 200, headers: HEADERS, body: JSON.stringify(data) }
}

function err(message, status = 400) {
  return { statusCode: status, headers: HEADERS, body: JSON.stringify({ error: message }) }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return err('Method not allowed', 405)
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return err('Invalid JSON body')
  }

  const { action } = payload
  if (!action) return err('Missing action')

  // Auth check for manager-only actions
  if (MANAGER_ACTIONS.has(action)) {
    try {
      verifySession(event)
    } catch (e) {
      return err(e.message, 401)
    }
  }

  // Load stored credentials
  const config = await getConfig()
  if (!config.googleRefreshToken) {
    return err('App not set up — manager must sign in with Google first.', 503)
  }

  let accessToken
  try {
    accessToken = await refreshAccessToken(config.googleRefreshToken)
  } catch (e) {
    return err(`Google auth error: ${e.message}`, 502)
  }

  // Ensure spreadsheet exists (fast if already in config)
  let spreadsheetId = config.spreadsheetId
  if (!spreadsheetId) {
    try {
      spreadsheetId = await ensureSpreadsheet(accessToken)
    } catch (e) {
      return err(`Sheets setup error: ${e.message}`, 502)
    }
  }

  try {
    switch (action) {
      case 'getMenu':
        return ok(await getMenu(accessToken, spreadsheetId, payload.date))

      case 'getOrders':
        return ok(await getOrders(accessToken, spreadsheetId, payload.date))

      case 'publishMenu':
        return ok(await publishMenu(accessToken, spreadsheetId, payload))

      case 'createOrder':
        return ok(await createOrder(accessToken, spreadsheetId, payload))

      case 'markCollected':
        return ok(await markCollected(accessToken, spreadsheetId, payload))

      default:
        return err(`Unknown action: ${action}`)
    }
  } catch (e) {
    console.error(`[api] ${action} error:`, e)
    return err(e.message, 500)
  }
}
