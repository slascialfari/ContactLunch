// Netlify Blobs — persistent server-side config store.
// Holds: googleRefreshToken, spreadsheetId, paypalMerchantEmail, paypalMerchantId
// Single-user app: one config object, key = 'config'.

const { getStore } = require('@netlify/blobs')

const STORE_NAME = 'contactlunch'
const CONFIG_KEY = 'config'

function getConfigStore() {
  return getStore(STORE_NAME)
}

async function getConfig() {
  try {
    const store = getConfigStore()
    const data  = await store.get(CONFIG_KEY, { type: 'json' })
    return data || {}
  } catch (err) {
    // Blobs unavailable in local dev without netlify dev
    console.warn('Blobs unavailable:', err.message)
    return {}
  }
}

async function setConfig(updates) {
  try {
    const store   = getConfigStore()
    const current = await getConfig()
    await store.setJSON(CONFIG_KEY, { ...current, ...updates })
  } catch (err) {
    console.warn('Blobs write failed:', err.message)
  }
}

module.exports = { getConfig, setConfig }
