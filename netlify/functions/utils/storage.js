// Netlify Blobs — persistent server-side config store.
// Holds: googleRefreshToken, spreadsheetId, paypalMerchantEmail, paypalMerchantId
// Single-user app: one config object, key = 'config'.

// Require is lazy (inside functions) so a load failure is caught by try/catch
// rather than crashing the entire function at module initialisation time.

const STORE_NAME = 'contactlunch'
const CONFIG_KEY = 'config'

async function getConfig() {
  try {
    const { getStore } = require('@netlify/blobs')
    const store = getStore(STORE_NAME)
    const data  = await store.get(CONFIG_KEY, { type: 'json' })
    return data || {}
  } catch (err) {
    console.warn('Blobs unavailable:', err.message)
    return {}
  }
}

async function setConfig(updates) {
  const { getStore } = require('@netlify/blobs')
  const store   = getStore(STORE_NAME)
  const current = await getConfig()
  await store.setJSON(CONFIG_KEY, { ...current, ...updates })
}

module.exports = { getConfig, setConfig }
